import crypto from "node:crypto";
import argon2 from "argon2";
import prisma from "../../../lib/prisma";
import { AppError } from "../../errors/AppError";
import {
  signAccessToken,
  signRefreshToken,
  signSocketToken,
  verifyRefreshToken,
} from "../../utils/jwt";
import { Role } from "../../../generated/prisma/client";
import type { LoginInput, RegisterInput } from "./auth.validation";

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function parseTokenExpiry(expiresInStr: string): Date {
  const match = expiresInStr.match(/^(\d+)([dhms])$/);
  const now = Date.now();
  if (!match || !match[1] || !match[2]) return new Date(now + 7 * 24 * 60 * 60 * 1000); // 7d fallback
  const val = parseInt(match[1], 10);
  const unit = match[2];
  if (unit === "d") return new Date(now + val * 24 * 60 * 60 * 1000);
  if (unit === "h") return new Date(now + val * 60 * 60 * 1000);
  if (unit === "m") return new Date(now + val * 60 * 1000);
  return new Date(now + val * 1000);
}

export class AuthService {
  static async register(data: RegisterInput) {
    const existing = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase() },
    });
    if (existing) {
      throw new AppError(409, "Email is already registered");
    }

    let clinicId = data.clinicId;
    if (!clinicId) {
      const defaultClinic = await prisma.clinic.findFirst();
      if (!defaultClinic) {
        throw new AppError(400, "No clinic registered in the system");
      }
      clinicId = defaultClinic.id;
    } else {
      const clinic = await prisma.clinic.findUnique({ where: { id: clinicId } });
      if (!clinic) {
        throw new AppError(404, "Specified clinic not found");
      }
    }

    const passwordHash = await argon2.hash(data.password);

    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email: data.email.toLowerCase(),
          passwordHash,
          role: Role.PATIENT,
          clinicId,
          preferredLanguage: data.preferredLanguage || "en",
        },
      });

      await tx.patientProfile.create({
        data: {
          userId: newUser.id,
          phone: data.phone ?? null,
          dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
        },
      });

      return newUser;
    });

    const accessToken = signAccessToken({
      sub: user.id,
      role: user.role,
      clinicId: user.clinicId,
    });
    const refreshToken = signRefreshToken({
      sub: user.id,
      role: user.role,
      clinicId: user.clinicId,
    });

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(refreshToken),
        expiresAt: parseTokenExpiry("7d"),
      },
    });

    const fullUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        role: true,
        clinicId: true,
        preferredLanguage: true,
        createdAt: true,
        patientProfile: true,
        clinic: {
          select: { id: true, name: true, timezone: true },
        },
      },
    });

    return { user: fullUser, accessToken, refreshToken };
  }

  static async login(data: LoginInput) {
    const user = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase() },
      include: {
        doctorProfile: true,
        patientProfile: true,
        clinic: {
          select: { id: true, name: true, timezone: true },
        },
      },
    });

    if (!user) {
      throw new AppError(401, "Invalid email or password");
    }

    const isValid = await argon2.verify(user.passwordHash, data.password);
    if (!isValid) {
      throw new AppError(401, "Invalid email or password");
    }

    const accessToken = signAccessToken({
      sub: user.id,
      role: user.role,
      clinicId: user.clinicId,
    });
    const refreshToken = signRefreshToken({
      sub: user.id,
      role: user.role,
      clinicId: user.clinicId,
    });

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(refreshToken),
        expiresAt: parseTokenExpiry("7d"),
      },
    });

    // Strip passwordHash before returning
    const { passwordHash: _hash, ...safeUser } = user;

    return {
      user: safeUser,
      accessToken,
      refreshToken,
    };
  }

  static async refreshToken(refreshToken: string) {
    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      throw new AppError(401, "Invalid or expired refresh token");
    }

    if (payload.type !== "refresh") {
      throw new AppError(401, "Invalid token type");
    }

    const tokenHash = hashToken(refreshToken);
    const existing = await prisma.refreshToken.findUnique({
      where: { tokenHash },
    });

    if (!existing) {
      throw new AppError(401, "Refresh token not found or already revoked");
    }

    // Token rotation: delete old token, issue new pair
    await prisma.refreshToken.delete({
      where: { id: existing.id },
    });

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user) {
      throw new AppError(401, "User no longer exists");
    }

    const newAccessToken = signAccessToken({
      sub: user.id,
      role: user.role,
      clinicId: user.clinicId,
    });
    const newRefreshToken = signRefreshToken({
      sub: user.id,
      role: user.role,
      clinicId: user.clinicId,
    });

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(newRefreshToken),
        expiresAt: parseTokenExpiry("7d"),
      },
    });

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }

  static async logout(refreshToken?: string) {
    if (!refreshToken) return;
    const tokenHash = hashToken(refreshToken);
    await prisma.refreshToken.deleteMany({
      where: { tokenHash },
    });
  }

  static generateSocketToken(userId: string, role: string, clinicId: string) {
    const socketToken = signSocketToken({
      sub: userId,
      role,
      clinicId,
    });
    return { socketToken };
  }

  static async getMe(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        clinicId: true,
        preferredLanguage: true,
        createdAt: true,
        clinic: {
          select: { id: true, name: true, timezone: true },
        },
        doctorProfile: {
          include: {
            schedules: true,
          },
        },
        patientProfile: true,
      },
    });

    if (!user) {
      throw new AppError(404, "User not found");
    }

    return user;
  }
}

import jwt from "jsonwebtoken";
import { env } from "../config/env";

export type TokenPayload = {
  sub: string;       // userId
  role: string;
  clinicId: string;
  type: "access" | "refresh" | "socket";
};

export function signAccessToken(payload: Omit<TokenPayload, "type">): string {
  return jwt.sign({ ...payload, type: "access" }, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN,
  } as jwt.SignOptions);
}

export function signRefreshToken(payload: Omit<TokenPayload, "type">): string {
  return jwt.sign({ ...payload, type: "refresh" }, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN,
  } as jwt.SignOptions);
}

export function signSocketToken(payload: Omit<TokenPayload, "type">): string {
  return jwt.sign({ ...payload, type: "socket" }, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_SOCKET_EXPIRES_IN,
  } as jwt.SignOptions);
}

export function verifyAccessToken(token: string): TokenPayload {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as TokenPayload;
}

export function verifyRefreshToken(token: string): TokenPayload {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as TokenPayload;
}

export function verifySocketToken(token: string): TokenPayload {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as TokenPayload;
}

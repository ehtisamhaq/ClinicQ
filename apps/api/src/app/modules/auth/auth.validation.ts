import { z } from "zod";

const registerBodySchema = z.object({
  clinicId: z.string().min(1).optional(),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  phone: z.string().optional(),
  preferredLanguage: z.string().default("en"),
  dateOfBirth: z.string().datetime().optional(),
});

export const registerSchema = {
  body: registerBodySchema,
};

const loginBodySchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const loginSchema = {
  body: loginBodySchema,
};

const refreshTokenBodySchema = z.object({
  refreshToken: z.string().min(1, "Refresh token is required"),
});

export const refreshTokenSchema = {
  body: refreshTokenBodySchema,
};

export type RegisterInput = z.infer<typeof registerBodySchema>;
export type LoginInput = z.infer<typeof loginBodySchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenBodySchema>;

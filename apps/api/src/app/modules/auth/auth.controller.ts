import type { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { AuthService } from "./auth.service";

export class AuthController {
  static register = catchAsync(async (req: Request, res: Response) => {
    const result = await AuthService.register(req.body);
    sendResponse(res, {
      statusCode: 201,
      success: true,
      message: "User registered successfully",
      data: result,
    });
  });

  static login = catchAsync(async (req: Request, res: Response) => {
    const result = await AuthService.login(req.body);
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Login successful",
      data: result,
    });
  });

  static refreshToken = catchAsync(async (req: Request, res: Response) => {
    const { refreshToken } = req.body;
    const result = await AuthService.refreshToken(refreshToken);
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Token refreshed successfully",
      data: result,
    });
  });

  static logout = catchAsync(async (req: Request, res: Response) => {
    const { refreshToken } = req.body;
    await AuthService.logout(refreshToken);
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Logged out successfully",
    });
  });

  static socketToken = catchAsync(async (req: Request, res: Response) => {
    const user = req.user!;
    const result = AuthService.generateSocketToken(user.id, user.role, user.clinicId);
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Socket token generated successfully",
      data: result,
    });
  });

  static getMe = catchAsync(async (req: Request, res: Response) => {
    const user = req.user!;
    const profile = await AuthService.getMe(user.id);
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Current user profile retrieved",
      data: profile,
    });
  });
}

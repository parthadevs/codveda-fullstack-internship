import { Request, Response } from "express";
import asyncHandler from "../../utils/async-handler";
import { authService } from "./auth.service";

class AuthController {
  signup = asyncHandler(async (req: Request, res: Response) => {
    const { user } = await authService.signup(req.body);

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: user,
    });
  });

  login = asyncHandler(async (req: Request, res: Response) => {
    const { user, accessToken, refreshToken } = await authService.login(req.body);

    res.cookie("token", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: { user, accessToken, refreshToken },
    });
  });

  logout = asyncHandler(async (req: Request, res: Response) => {
    const token = req.cookies?.token || req.headers.authorization?.replace("Bearer ", "");

    if (token) {
      await authService.logout(token);
    }

    res.clearCookie("token");

    res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  });

  me = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized", statusCode: 401 });
      return;
    }

    const user = await authService.me(userId);

    res.status(200).json({
      success: true,
      message: "User profile",
      data: user,
    });
  });

  refresh = asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      res.status(400).json({ success: false, message: "Refresh token required", statusCode: 400 });
      return;
    }

    const { accessToken, refreshToken: newRefreshToken } = await authService.refresh(refreshToken);

    res.status(200).json({
      success: true,
      message: "Token refreshed",
      data: { accessToken, refreshToken: newRefreshToken },
    });
  });
}

export const authController = new AuthController();
export default authController;
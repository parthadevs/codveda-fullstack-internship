import { hashPassword, verifyPassword } from "../../utils/password";
import { signToken } from "../../utils/token";
import { prisma } from "../../config/database";
import AppError from "../../utils/app-error";
import { signupSchema, loginSchema } from "./auth.schema";

type SignupInput = z.infer<typeof signupSchema>;
type LoginInput = z.infer<typeof loginSchema>;

import { z } from "zod";

class AuthService {
  async signup(data: SignupInput) {

    const existing = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existing) {
      throw AppError.conflict("Email already registered");
    }

    const hashedPassword = await hashPassword(data.password);

    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword,
        age: data.age ?? null,
      },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });

    return { user };
  }

  async login(data: LoginInput) {
    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user) {
      throw AppError.unauthorized("Invalid credentials");
    }

    const valid = await verifyPassword(data.password, user.password);
    if (!valid) {
      throw AppError.unauthorized("Invalid credentials");
    }

    const accessToken = signToken({ userId: user.id, role: user.role }, "7d");
    const refreshToken = signToken({ userId: user.id, type: "refresh" }, "30d");

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      accessToken,
      refreshToken,
    };
  }

  async logout(token: string) {
    await prisma.refreshToken.deleteMany({
      where: { token },
    });
  }

  async refresh(refreshToken: string) {
    const stored = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (!stored || stored.expiresAt < new Date()) {
      throw AppError.unauthorized("Invalid or expired refresh token");
    }

    const accessToken = signToken({ userId: stored.user.id, role: stored.user.role }, "7d");
    const newRefreshToken = signToken({ userId: stored.user.id, type: "refresh" }, "30d");

    await prisma.refreshToken.delete({ where: { id: stored.id } });
    await prisma.refreshToken.create({
      data: {
        token: newRefreshToken,
        userId: stored.user.id,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    return { accessToken, refreshToken: newRefreshToken };
  }

  async me(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });

    if (!user) {
      throw AppError.notFound("User not found");
    }

    return user;
  }
}

export const authService = new AuthService();
export default authService;
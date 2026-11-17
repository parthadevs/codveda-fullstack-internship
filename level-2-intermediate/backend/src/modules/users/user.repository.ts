import { Prisma } from "@prisma/client";
import { prisma } from "../../config/database";

import { UserEntity, UserResponse, USER_SELECT, USER_SELECT_WITH_PASSWORD } from "./user.types";
import { UserQueryParams } from "./user.schema";

class UserRepository {
  private readonly db = prisma;

  async findById(id: string): Promise<UserEntity | null> {
    return this.db.user.findUnique({ where: { id }, select: USER_SELECT_WITH_PASSWORD });
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    return this.db.user.findUnique({
      where: { email: email.trim().toLowerCase() },
      select: USER_SELECT_WITH_PASSWORD,
    });
  }

  async create(data: Omit<UserEntity, "id" | "createdAt" | "updatedAt">): Promise<UserEntity> {
    return this.db.user.create({
      data: { ...data, email: data.email.trim().toLowerCase() },
      select: USER_SELECT_WITH_PASSWORD,
    });
  }

  async update(id: string, data: Prisma.UserUpdateInput): Promise<UserEntity> {
    if ("email" in data && data.email !== undefined) {
      data.email = String(data.email).trim().toLowerCase();
    }

    return this.db.user.update({ where: { id }, data, select: USER_SELECT_WITH_PASSWORD });
  }

  async delete(id: string): Promise<UserEntity> {
    return this.db.user.delete({ where: { id }, select: USER_SELECT_WITH_PASSWORD });
  }

  async findMany(params: Partial<UserQueryParams> = {}): Promise<{ data: UserResponse[]; total: number }> {
    const { page = 1, limit = 10, search, sortBy = "createdAt", order = "desc" } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.UserWhereInput = search?.trim()
      ? {
          OR: [
            { name: { contains: search.trim(), mode: "insensitive" } },
            { email: { contains: search.trim().toLowerCase(), mode: "insensitive" } },
          ],
        }
      : {};

    const [data, total] = await this.db.$transaction([
      this.db.user.findMany({
        where,
        select: USER_SELECT,
        orderBy: { [sortBy]: order },
        skip,
        take: limit,
      }),
      this.db.user.count({ where }),
    ]);

    return { data, total };
  }

  async emailExists(email: string, excludeId?: string): Promise<boolean> {
    const user = await this.db.user.findFirst({
      where: { email: email.trim().toLowerCase(), ...(excludeId ? { id: { not: excludeId } } : {}) },
      select: { id: true },
    });

    return !!user;
  }
}

export const userRepository = new UserRepository();
export default userRepository;
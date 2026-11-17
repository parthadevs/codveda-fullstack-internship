import { hash, compare } from "bcryptjs";
import AppError from "../../utils/app-error";
import { userRepository } from "./user.repository";
import {
  CreateUserInput,
  UpdateUserInput,
  UserQueryParams,
} from "./user.schema";
import { UserEntity, UserResponse, PaginatedUsers } from "./user.types";

const SALT_ROUNDS = 12;

function toResponse(user: UserEntity): UserResponse {
  const { password, ...rest } = user;
  return rest;
}

class UserService {
  async getAllUsers(params: Partial<UserQueryParams> = {}): Promise<PaginatedUsers> {
    const { page = 1, limit = 10 } = params;
    const { data, total } = await userRepository.findMany(params);
    const pages = Math.ceil(total / limit);

    return {
      data,
      pagination: { page, limit, total, pages },
    };
  }

  async getUserById(id: string): Promise<UserResponse> {
    const user = await userRepository.findById(id);
    if (!user) {
      throw AppError.notFound(`User ${id} not found`);
    }
    return toResponse(user);
  }

  async createUser(data: CreateUserInput): Promise<UserResponse> {
    if (await userRepository.emailExists(data.email)) {
      throw AppError.conflict("Email already exists");
    }

    const user = await userRepository.create({
      ...data,
      password: await hash(data.password, SALT_ROUNDS),
      age: data.age ?? null,
    });
    return toResponse(user);
  }

  async updateUser(id: string, data: UpdateUserInput): Promise<UserResponse> {
    const existing = await userRepository.findById(id);
    if (!existing) {
      throw AppError.notFound(`User ${id} not found`);
    }

    if (data.email && data.email !== existing.email) {
      if (await userRepository.emailExists(data.email, id)) {
        throw AppError.conflict("Email already exists");
      }
    }

    const updateData: UpdateUserInput = { ...data };
    if (updateData.password) {
      updateData.password = await hash(updateData.password, SALT_ROUNDS);
    }

    const user = await userRepository.update(id, updateData as any);
    return toResponse(user);
  }

  async deleteUser(id: string): Promise<{ message: string }> {
    const existing = await userRepository.findById(id);
    if (!existing) {
      throw AppError.notFound(`User ${id} not found`);
    }

    await userRepository.delete(id);
    return { message: "User deleted" };
  }

  async authenticateUser(email: string, password: string): Promise<UserResponse> {
    const user = await userRepository.findByEmail(email);
    if (!user) {
      throw AppError.unauthorized("Invalid credentials");
    }

    const valid = await compare(password, user.password);
    if (!valid) {
      throw AppError.unauthorized("Invalid credentials");
    }

    return toResponse(user);
  }
}

export const userService = new UserService();
export default userService;
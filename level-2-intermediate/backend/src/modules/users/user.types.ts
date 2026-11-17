import { Prisma } from "@prisma/client";

export interface UserEntity {
  id: string;
  name: string;
  email: string;
  password: string;
  age: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserResponse {
  id: string;
  name: string;
  email: string;
  age: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaginatedUsers {
  data: UserResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export const USER_SELECT = {
  id: true,
  name: true,
  email: true,
  age: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UserSelect;

export const USER_SELECT_WITH_PASSWORD = {
  ...USER_SELECT,
  password: true,
} satisfies Prisma.UserSelect;
import { z } from "zod";

export const createUserSchema = z.object({
  name: z.string().min(1).max(100).trim(),
  email: z.string().email().max(255).trim().toLowerCase(),
  password: z.string().min(6).max(100),
  age: z.number().int().min(0).max(150).optional(),
});

export const updateUserSchema = z.object({
  name: z.string().min(1).max(100).trim().optional(),
  email: z.string().email().max(255).trim().toLowerCase().optional(),
  password: z.string().min(6).max(100).optional(),
  age: z.number().int().min(0).max(150).nullable().optional(),
});

export const userIdParamSchema = z.object({
  id: z.string().cuid(),
});

export const userQuerySchema = z.object({
  page: z.string().optional().transform((v) => (v ? Math.max(1, parseInt(v, 10)) : 1)),
  limit: z.string().optional().transform((v) => (v ? Math.min(100, Math.max(1, parseInt(v, 10))) : 10)),
  search: z.string().optional(),
  sortBy: z.enum(["name", "email", "createdAt"]).optional().default("createdAt"),
  order: z.enum(["asc", "desc"]).optional().default("desc"),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type UserIdParam = z.infer<typeof userIdParamSchema>;
export type UserQueryParams = z.infer<typeof userQuerySchema>;
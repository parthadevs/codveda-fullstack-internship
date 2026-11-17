import { z } from "zod";

export const createProductSchema = z.object({
  name: z.string().min(1).max(200).trim(),
  description: z.string().max(1000).trim().optional(),
  price: z.number().min(0).max(1000000),
  stock: z.number().int().min(0).default(0),
  sku: z.string().max(50).trim().optional(),
  categoryId: z.string().cuid().optional(),
});

export const updateProductSchema = z.object({
  name: z.string().min(1).max(200).trim().optional(),
  description: z.string().max(1000).trim().nullable().optional(),
  price: z.number().min(0).max(1000000).optional(),
  stock: z.number().int().min(0).optional(),
  sku: z.string().max(50).trim().nullable().optional(),
  categoryId: z.string().cuid().optional(),
  isActive: z.boolean().optional(),
});

export const productIdParamSchema = z.object({
  id: z.string().cuid(),
});

export const productQuerySchema = z.object({
  page: z.string().optional().transform((v) => (v ? Math.max(1, parseInt(v, 10)) : 1)),
  limit: z.string().optional().transform((v) => (v ? Math.min(100, Math.max(1, parseInt(v, 10))) : 10)),
  search: z.string().optional(),
  categoryId: z.string().optional(),
  minPrice: z.string().optional().transform((v) => (v ? Number(v) : undefined)),
  maxPrice: z.string().optional().transform((v) => (v ? Number(v) : undefined)),
  inStock: z.string().optional().transform((v) => (v === "true" ? true : v === "false" ? false : undefined)),
  sortBy: z.enum(["name", "price", "createdAt", "stock"]).optional().default("createdAt"),
  order: z.enum(["asc", "desc"]).optional().default("desc"),
});

export const statusToggleSchema = z.object({
  isActive: z.boolean(),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type ProductIdParam = z.infer<typeof productIdParamSchema>;
export type ProductQueryParams = z.infer<typeof productQuerySchema>;
export type StatusToggleInput = z.infer<typeof statusToggleSchema>;
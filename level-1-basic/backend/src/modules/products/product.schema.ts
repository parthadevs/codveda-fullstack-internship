import { z } from 'zod';

export const createProductSchema = z.object({
  name: z
    .string()
    .min(1, 'Product name is required')
    .max(200, 'Product name must be at most 200 characters')
    .trim(),
  description: z
    .string()
    .max(1000, 'Description must be at most 1000 characters')
    .trim()
    .optional(),
  price: z
    .number()
    .min(0, 'Price must be at least 0')
    .max(1000000, 'Price must be at most 1,000,000'),
  stock: z
    .number()
    .int('Stock must be an integer')
    .min(0, 'Stock must be at least 0')
    .default(0),
  sku: z
    .string()
    .max(50, 'SKU must be at most 50 characters')
    .trim()
    .optional(),
  category: z
    .string()
    .max(100, 'Category must be at most 100 characters')
    .trim()
    .optional(),
});

export const updateProductSchema = z.object({
  name: z
    .string()
    .min(1, 'Product name is required')
    .max(200, 'Product name must be at most 200 characters')
    .trim()
    .optional(),
  description: z
    .string()
    .max(1000, 'Description must be at most 1000 characters')
    .trim()
    .nullable()
    .optional(),
  price: z
    .number()
    .min(0, 'Price must be at least 0')
    .max(1000000, 'Price must be at most 1,000,000')
    .optional(),
  stock: z
    .number()
    .int('Stock must be an integer')
    .min(0, 'Stock must be at least 0')
    .optional(),
  sku: z
    .string()
    .max(50, 'SKU must be at most 50 characters')
    .trim()
    .nullable()
    .optional(),
  category: z
    .string()
    .max(100, 'Category must be at most 100 characters')
    .trim()
    .nullable()
    .optional(),
  isActive: z
    .boolean()
    .optional(),
});

export const productIdParamSchema = z.object({
  id: z.string().cuid('Invalid product ID format'),
});

export const productQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? Math.max(1, parseInt(val, 10)) : 1)),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? Math.min(100, Math.max(1, parseInt(val, 10))) : 10)),
  search: z.string().optional(),
  category: z.string().optional(),
  minPrice: z
    .string()
    .optional()
    .transform((val) => (val ? Number(val) : undefined)),
  maxPrice: z
    .string()
    .optional()
    .transform((val) => (val ? Number(val) : undefined)),
  inStock: z
    .string()
    .optional()
    .transform((val) => (val === 'true' ? true : val === 'false' ? false : undefined)),
  sortBy: z.enum(['name', 'price', 'createdAt', 'stock']).optional().default('createdAt'),
  order: z.enum(['asc', 'desc']).optional().default('desc'),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type ProductIdParam = z.infer<typeof productIdParamSchema>;
export type ProductQueryParams = z.infer<typeof productQuerySchema>;
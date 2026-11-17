import { Prisma } from "@prisma/client";

export interface ProductEntity {
  id: string;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  sku: string | null;
  categoryId: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
}

export interface ProductResponse {
  id: string;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  sku: string | null;
  categoryId: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
}

export interface PaginatedProducts {
  data: ProductResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export const PRODUCT_SELECT = {
  id: true,
  name: true,
  description: true,
  price: true,
  stock: true,
  sku: true,
  categoryId: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
  userId: true,
} satisfies Prisma.ProductSelect;
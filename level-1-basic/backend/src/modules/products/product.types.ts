import { Prisma } from "@prisma/client";

export interface ProductEntity {
  id: string;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  sku: string | null;
  category: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductResponse {
  id: string;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  sku: string | null;
  category: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
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
  category: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.ProductSelect;
import { Prisma } from "@prisma/client";
import { prisma } from "../../config/database";
import { logger } from "../../utils/logger";

import {
  ProductEntity,
  ProductResponse,
  PRODUCT_SELECT,
} from "./product.types";
import { ProductQueryParams } from "./product.schema";

class ProductRepository {
  private readonly db = prisma;

  async findById(id: string): Promise<ProductEntity | null> {
    return this.db.product.findUnique({
      where: { id },
      select: PRODUCT_SELECT,
    });
  }

  async findBySku(sku: string): Promise<ProductEntity | null> {
    return this.db.product.findUnique({
      where: { sku },
    });
  }

  async create(
    data: Omit<ProductEntity, "id" | "createdAt" | "updatedAt">,
  ): Promise<ProductEntity> {
    return this.db.product.create({
      data: {
        ...data,
        description: data.description ?? null,
        sku: data.sku ?? null,
        category: data.category ?? null,
      },
      select: PRODUCT_SELECT,
    });
  }

  async update(id: string, data: Prisma.ProductUpdateInput): Promise<ProductEntity> {
    return this.db.product.update({
      where: { id },
      data,
      select: PRODUCT_SELECT,
    });
  }

  async delete(id: string): Promise<ProductEntity> {
    return this.db.product.delete({
      where: { id },
      select: PRODUCT_SELECT,
    });
  }

  async findMany(
    params: Partial<ProductQueryParams> = {},
  ): Promise<{ data: ProductResponse[]; total: number }> {
    const {
      page = 1,
      limit = 10,
      search,
      category,
      isActive,
      minPrice,
      maxPrice,
      inStock,
      sortBy = "createdAt",
      order = "desc",
    } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.ProductWhereInput = {};

    if (search?.trim()) {
      where.OR = [
        { name: { contains: search.trim(), mode: "insensitive" } },
        { description: { contains: search.trim(), mode: "insensitive" } },
      ];
    }

    if (category) {
      where.category = { equals: category, mode: "insensitive" };
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = {};
      if (minPrice !== undefined) {
        where.price.gte = minPrice;
      }
      if (maxPrice !== undefined) {
        where.price.lte = maxPrice;
      }
    }

    if (inStock !== undefined) {
      where.stock = inStock ? { gt: 0 } : 0;
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    try {
      const [data, total] = await this.db.$transaction([
        this.db.product.findMany({
          where,
          select: PRODUCT_SELECT,
          orderBy: { [sortBy]: order },
          skip,
          take: limit,
        }),
        this.db.product.count({ where }),
      ]);

      return { data, total };
    } catch (error) {
      logger.error("Failed to retrieve products", { params, error });
      throw error;
    }
  }

  async skuExists(sku: string, excludeId?: string): Promise<boolean> {
    const product = await this.db.product.findFirst({
      where: {
        sku,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
      select: { id: true },
    });

    return product !== null;
  }

  async toggleStatus(id: string, isActive: boolean): Promise<ProductEntity> {
    return this.db.product.update({
      where: { id },
      data: { isActive },
      select: PRODUCT_SELECT,
    });
  }
}

export const productRepository = new ProductRepository();
export default productRepository;
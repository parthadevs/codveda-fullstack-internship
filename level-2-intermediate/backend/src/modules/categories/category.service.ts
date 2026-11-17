import AppError from "../../utils/app-error";
import { prisma } from "../../config/database";
import {
  CreateCategoryInput,
  UpdateCategoryInput,
} from "./category.schema";

class CategoryService {
  async create(data: CreateCategoryInput) {
    const existing = await prisma.category.findUnique({
      where: { name: data.name },
    });

    if (existing) {
      throw AppError.conflict("Category already exists");
    }

    return prisma.category.create({
      data: { name: data.name },
      select: { id: true, name: true, createdAt: true, updatedAt: true },
    });
  }

  async getAll() {
    return prisma.category.findMany({
      select: { id: true, name: true, createdAt: true, updatedAt: true },
      orderBy: { name: "asc" },
    });
  }

  async getById(id: string) {
    const category = await prisma.category.findUnique({
      where: { id },
      select: { id: true, name: true, createdAt: true, updatedAt: true },
    });

    if (!category) {
      throw AppError.notFound(`Category ${id} not found`);
    }

    return category;
  }

  async update(id: string, data: UpdateCategoryInput) {
    const existing = await prisma.category.findUnique({
      where: { id },
    });

    if (!existing) {
      throw AppError.notFound(`Category ${id} not found`);
    }

    if (data.name) {
      const nameExists = await prisma.category.findUnique({
        where: { name: data.name },
      });

      if (nameExists && nameExists.id !== id) {
        throw AppError.conflict("Category name already exists");
      }
    }

    return prisma.category.update({
      where: { id },
      data,
      select: { id: true, name: true, createdAt: true, updatedAt: true },
    });
  }

  async delete(id: string) {
    const existing = await prisma.category.findUnique({
      where: { id },
    });

    if (!existing) {
      throw AppError.notFound(`Category ${id} not found`);
    }

    await prisma.category.delete({ where: { id } });

    return { message: "Category deleted" };
  }
}

export const categoryService = new CategoryService();
export default categoryService;
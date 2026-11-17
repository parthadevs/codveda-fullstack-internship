import { Request, Response } from "express";
import asyncHandler from "../../utils/async-handler";
import { categoryService } from "./category.service";

class CategoryController {
  getAll = asyncHandler(async (_req: Request, res: Response) => {
    const categories = await categoryService.getAll();

    res.status(200).json({
      success: true,
      message: "Categories retrieved",
      data: categories,
    });
  });

  getById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as { id: string };
    const category = await categoryService.getById(id);

    res.status(200).json({
      success: true,
      message: "Category retrieved",
      data: category,
    });
  });

  create = asyncHandler(async (req: Request, res: Response) => {
    const category = await categoryService.create(req.body);

    res.status(201).json({
      success: true,
      message: "Category created",
      data: category,
    });
  });

  update = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as { id: string };
    const category = await categoryService.update(id, req.body);

    res.status(200).json({
      success: true,
      message: "Category updated",
      data: category,
    });
  });

  delete = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as { id: string };
    const result = await categoryService.delete(id);

    res.status(200).json({
      success: true,
      message: result.message,
    });
  });
}

export const categoryController = new CategoryController();
export default categoryController;
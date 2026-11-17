import { Request, Response } from "express";
import asyncHandler from "../../utils/async-handler";
import { productService } from "./product.service";
import { ProductQueryParams } from "./product.schema";

class ProductController {
  getAllProducts = asyncHandler(async (req: Request, res: Response) => {
    const params = req.query as unknown as ProductQueryParams;
    const result = await productService.getAllProducts(params);

    res.status(200).json({
      success: true,
      message: "Products retrieved",
      data: result,
    });
  });

  getProductById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as { id: string };
    const product = await productService.getProductById(id);

    res.status(200).json({
      success: true,
      message: "Product retrieved",
      data: product,
    });
  });

  createProduct = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized", statusCode: 401 });
      return;
    }

    const product = await productService.createProduct(req.body, userId);

    res.status(201).json({
      success: true,
      message: "Product created",
      data: product,
    });
  });

  updateProduct = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as { id: string };
    const product = await productService.updateProduct(id, req.body);

    res.status(200).json({
      success: true,
      message: "Product updated",
      data: product,
    });
  });

  deleteProduct = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as { id: string };
    await productService.deleteProduct(id);

    res.status(200).json({
      success: true,
      message: "Product deleted",
    });
  });

  toggleStatus = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as { id: string };
    const { isActive } = req.body;
    const product = await productService.toggleStatus(id, isActive);

    res.status(200).json({
      success: true,
      message: `Product ${isActive ? "activated" : "deactivated"}`,
      data: product,
    });
  });
}

export const productController = new ProductController();
export default productController;
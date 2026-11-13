import { Router } from "express";
import asyncHandler from "@utils/async-handler";
import validate from "@middlewares/validate.middleware";
import {
  createProductSchema,
  updateProductSchema,
  productIdParamSchema,
  productQuerySchema,
} from "./product.schema";
import { productController } from "./product.controller";

const router = Router();

router.get(
  "/",
  validate(productQuerySchema, "query"),
  asyncHandler(productController.getAllProducts),
);

router.get(
  "/:id",
  validate(productIdParamSchema, "params"),
  asyncHandler(productController.getProductById),
);

router.post(
  "/",
  validate(createProductSchema, "body"),
  asyncHandler(productController.createProduct),
);

router.patch(
  "/:id",
  validate(productIdParamSchema, "params"),
  validate(updateProductSchema, "body"),
  asyncHandler(productController.updateProduct),
);

router.delete(
  "/:id",
  validate(productIdParamSchema, "params"),
  asyncHandler(productController.deleteProduct),
);

export default router;
export const productRoutes = router;
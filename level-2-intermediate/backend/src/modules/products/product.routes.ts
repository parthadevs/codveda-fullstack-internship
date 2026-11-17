import { Router } from "express";
import asyncHandler from "../../utils/async-handler";
import validate from "../../middlewares/validate.middleware";
import { authenticate } from "../../middlewares/authenticate.middleware";
import { rateLimit } from "../../middlewares/rate-limit.middleware";
import {
  createProductSchema,
  updateProductSchema,
  productIdParamSchema,
  productQuerySchema,
  statusToggleSchema,
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
  authenticate,
  rateLimit,
  validate(createProductSchema, "body"),
  asyncHandler(productController.createProduct),
);

router.patch(
  "/:id",
  authenticate,
  rateLimit,
  validate(productIdParamSchema, "params"),
  validate(updateProductSchema, "body"),
  asyncHandler(productController.updateProduct),
);

router.delete(
  "/:id",
  authenticate,
  rateLimit,
  validate(productIdParamSchema, "params"),
  asyncHandler(productController.deleteProduct),
);

router.patch(
  "/:id/status",
  authenticate,
  rateLimit,
  validate(productIdParamSchema, "params"),
  validate(statusToggleSchema, "body"),
  asyncHandler(productController.toggleStatus),
);

export default router;
export const productRoutes = router;
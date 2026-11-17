import { Router } from "express";
import asyncHandler from "../../utils/async-handler";
import validate from "../../middlewares/validate.middleware";
import { authenticate } from "../../middlewares/authenticate.middleware";
import { authorize } from "../../middlewares/authorize.middleware";
import { rateLimit } from "../../middlewares/rate-limit.middleware";
import {
  createCategorySchema,
  updateCategorySchema,
  categoryIdParamSchema,
} from "./category.schema";

import { categoryController } from "./category.controller";

const router = Router();

router.get("/", asyncHandler(categoryController.getAll));
router.get("/:id", asyncHandler(categoryController.getById));
router.post(
  "/",
  authenticate,
  authorize("ADMIN"),
  rateLimit,
  validate(createCategorySchema, "body"),
  asyncHandler(categoryController.create),
);
router.patch(
  "/:id",
  authenticate,
  authorize("ADMIN"),
  rateLimit,
  validate(categoryIdParamSchema, "params"),
  validate(updateCategorySchema, "body"),
  asyncHandler(categoryController.update),
);
router.delete(
  "/:id",
  authenticate,
  authorize("ADMIN"),
  rateLimit,
  validate(categoryIdParamSchema, "params"),
  asyncHandler(categoryController.delete),
);

export default router;
export const categoryRoutes = router;

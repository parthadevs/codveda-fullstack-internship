import { Router } from "express";
import asyncHandler from "../../utils/async-handler";
import validate from "../../middlewares/validate.middleware";
import { rateLimit } from "../../middlewares/rate-limit.middleware";
import {
  createUserSchema,
  updateUserSchema,
  userIdParamSchema,
  userQuerySchema,
} from "./user.schema";
import { userController } from "./user.controller";

const router = Router();

router.get(
  "/",
  validate(userQuerySchema, "query"),
  asyncHandler(userController.getAllUsers),
);

router.get(
  "/:id",
  validate(userIdParamSchema, "params"),
  asyncHandler(userController.getUserById),
);

router.post(
  "/",
  rateLimit,
  validate(createUserSchema, "body"),
  asyncHandler(userController.createUser),
);

router.patch(
  "/:id",
  rateLimit,
  validate(userIdParamSchema, "params"),
  validate(updateUserSchema, "body"),
  asyncHandler(userController.updateUser),
);

router.delete(
  "/:id",
  rateLimit,
  validate(userIdParamSchema, "params"),
  asyncHandler(userController.deleteUser),
);

export default router;
export const userRoutes = router;
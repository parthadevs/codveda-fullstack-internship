import { Router } from "express";
import asyncHandler from "../../utils/async-handler";
import validate from "../../middlewares/validate.middleware";
import { authenticate } from "../../middlewares/authenticate.middleware";
import {
  signupSchema,
  loginSchema,
} from "./auth.schema";
import { authController } from "./auth.controller";

const router = Router();

router.post(
  "/signup",
  validate(signupSchema, "body"),
  asyncHandler(authController.signup),
);

router.post(
  "/login",
  validate(loginSchema, "body"),
  asyncHandler(authController.login),
);

router.post(
  "/logout",
  authenticate,
  asyncHandler(authController.logout),
);

router.get(
  "/me",
  authenticate,
  asyncHandler(authController.me),
);

router.post(
  "/refresh",
  asyncHandler(authController.refresh),
);

export default router;
export const authRoutes = router;
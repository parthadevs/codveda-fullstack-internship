import { Request, Response } from "express";
import asyncHandler from "../../utils/async-handler";
import { userService } from "./user.service";

class UserController {
  getAllUsers = asyncHandler(async (req: Request, res: Response) => {
    const { page, limit, search, sortBy, order } = req.query;

    const result = await userService.getAllUsers({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      search: typeof search === "string" ? search : undefined,
      sortBy: sortBy as "name" | "email" | "createdAt" | undefined,
      order: order as "asc" | "desc" | undefined,
    });

    res.status(200).json({
      success: true,
      message: "Users retrieved",
      data: result,
    });
  });

  getUserById = asyncHandler(async (req: Request, res: Response) => {
    const user = await userService.getUserById(req.params.id as string);

    res.status(200).json({
      success: true,
      message: "User retrieved",
      data: user,
    });
  });

  createUser = asyncHandler(async (req: Request, res: Response) => {
    const user = await userService.createUser(req.body);

    res.status(201).json({
      success: true,
      message: "User created",
      data: user,
    });
  });

  updateUser = asyncHandler(async (req: Request, res: Response) => {
    const user = await userService.updateUser(req.params.id as string, req.body);

    res.status(200).json({
      success: true,
      message: "User updated",
      data: user,
    });
  });

  deleteUser = asyncHandler(async (req: Request, res: Response) => {
    await userService.deleteUser(req.params.id as string);

    res.status(200).json({
      success: true,
      message: "User deleted",
    });
  });
}

export const userController = new UserController();
export default userController;
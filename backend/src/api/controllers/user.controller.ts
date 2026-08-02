import { NextFunction, Request, Response } from "express";

import {
  changeUserPassword,
  createUser,
  loginUser,
  searchUsers,
} from "../../modules/users/user.service";

export async function registerUser(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  try {
    const user = await createUser(request.body);

    response.status(201).json({
      message: "User registered successfully",
      user,
    });
  } catch (error) {
    next(error);
  }
}

export async function login(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  try {
    const user = await loginUser(request.body);

    response.status(200).json({
      message: "Login successful",
      user,
    });
  } catch (error) {
    next(error);
  }
}

export async function searchUsersController(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  try {
    const users = await searchUsers(request.query.search, request.query.excludeUserId);
    response.status(200).json({ users });
  } catch (error) {
    next(error);
  }
}

export async function changePassword(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  try {
    const user = await changeUserPassword(request.body);

    response.status(200).json({
      message: "Password changed successfully",
      user,
    });
  } catch (error) {
    next(error);
  }
}

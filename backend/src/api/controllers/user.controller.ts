import { NextFunction, Request, Response } from "express";

import { createUser } from "../../modules/users/user.service";

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

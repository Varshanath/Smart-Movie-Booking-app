import { NextFunction, Request, Response } from "express";

import { ApiError } from "../utils/api-error";

export function errorHandler(
  error: Error,
  _request: Request,
  response: Response,
  _next: NextFunction,
) {
  if (error instanceof ApiError) {
    response.status(error.statusCode).json({ message: error.message });
    return;
  }

  response.status(500).json({ message: "Internal server error" });
}

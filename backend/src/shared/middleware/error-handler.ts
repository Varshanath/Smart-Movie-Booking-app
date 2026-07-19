import { NextFunction, Request, Response } from "express";

import { ApiError } from "../utils/api-error";
import { logError } from "../utils/error-logger";

export function errorHandler(
  error: Error,
  request: Request,
  response: Response,
  _next: NextFunction,
) {
  const statusCode = error instanceof ApiError ? error.statusCode : 500;

  logError(error, {
    method: request.method,
    path: request.originalUrl,
    statusCode,
  });

  if (error instanceof ApiError) {
    response.status(error.statusCode).json({ message: error.message });
    return;
  }

  response.status(500).json({ message: "Internal server error" });
}

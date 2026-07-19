import { mkdirSync, appendFileSync } from "fs";
import { join } from "path";

import { ApiError } from "./api-error";

const logDirectory = join(process.cwd(), "logs");
const errorLogPath = join(logDirectory, "backend-error.log");

type RequestLogContext = {
  method: string;
  path: string;
  statusCode: number;
};

export function logError(error: Error, context: RequestLogContext) {
  mkdirSync(logDirectory, { recursive: true });

  const entry = {
    timestamp: new Date().toISOString(),
    level: "error",
    method: context.method,
    path: context.path,
    statusCode: context.statusCode,
    errorName: error.name,
    message: error.message,
    stack: error instanceof ApiError ? undefined : error.stack,
  };

  appendFileSync(errorLogPath, `${JSON.stringify(entry)}\n`, "utf8");
}

export { errorLogPath };

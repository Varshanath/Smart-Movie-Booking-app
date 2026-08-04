import { NextFunction, Request, Response } from "express";

import { verifyAuthToken } from "../../modules/auth/token";
import { ApiError } from "../utils/api-error";

const AUTH_ERROR_MESSAGE = "Authentication is required";

// Not mounted on any route yet — created so it can be tested in isolation
// before it changes any existing endpoint's behavior. Never trusts a
// userId from the request body/path/query; the only identity it will ever
// attach is the one a valid token's signature actually vouches for.
export function authenticate(request: Request, _response: Response, next: NextFunction) {
  const header = request.headers.authorization;

  if (typeof header !== "string") {
    next(new ApiError(401, AUTH_ERROR_MESSAGE));
    return;
  }

  const [scheme, token, ...rest] = header.split(" ");
  if (scheme !== "Bearer" || !token || rest.length > 0) {
    next(new ApiError(401, AUTH_ERROR_MESSAGE));
    return;
  }

  try {
    const { userId } = verifyAuthToken(token);
    request.user = { id: userId };
    next();
  } catch {
    // Deliberately generic — never echo the token or the specific
    // verification failure reason back to the client or into logs.
    next(new ApiError(401, AUTH_ERROR_MESSAGE));
  }
}

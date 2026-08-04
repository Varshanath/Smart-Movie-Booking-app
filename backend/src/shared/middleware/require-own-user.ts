import { NextFunction, Request, Response } from "express";

import { ApiError } from "../utils/api-error";

// Must run AFTER `authenticate` on the same route — relies on req.user
// already being set. Rejects any request where the :userId path segment
// doesn't match the authenticated caller, so nobody can read or write
// another user's data just by knowing (or guessing) their id.
export function requireOwnUser(request: Request, _response: Response, next: NextFunction) {
  if (!request.user) {
    next(new ApiError(401, "Authentication is required"));
    return;
  }
  if (request.params.userId !== request.user.id) {
    next(new ApiError(403, "You do not have access to this resource"));
    return;
  }
  next();
}

// Augments Express's Request type so `req.user` is properly typed wherever
// it's read, instead of falling back to `any`. Only `authenticate`
// middleware (src/shared/middleware/authenticate.ts) ever sets this — it's
// optional here because most routes aren't behind that middleware.
import "express";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
      };
    }
  }
}

export {};

// Augment the Express Request type so handlers can read `req.userId`
// after the userContext middleware has parsed the X-User-Id header.

declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

export {};

import { Request, Response, NextFunction } from "express";

export function requireFields(fields: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const body = (req.body ?? {}) as Record<string, unknown>;
    const missing = fields.filter(
      (f) => !Object.prototype.hasOwnProperty.call(body, f)
    );
    if (missing.length > 0) {
      return res.status(400).json({ error: `Missing fields: ${missing.join(", ")}`});
    }
    next();
  };
}
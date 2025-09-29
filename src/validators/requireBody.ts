import { Request, Response, NextFunction } from "express";

export function requireBody(fields: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const body = req.body ?? {};
    const missing = fields.filter(f => !(f in body));
    if (missing.length > 0) return res.status(400).json({ error: `Missing fields: ${missing.join(", ")}` });
    next();
  };
}


import { Request, Response, NextFunction } from "express";

export function requireParams<Params extends Record<string, string>>(fields: (keyof Params)[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const missing = fields.filter(f => !(f in req.params));
    if (missing.length > 0)
      return res.status(400).json({ error: `Missing params: ${missing.join(", ")}` });
    next();
  };
}


import { Request, Response } from 'express';

/**
 * 404 Not Found handler
 * Handles routes that don't exist
 */
export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({
    error: 'Route not found',
    path: req.path,
    method: req.method
  });
}

// middleware/errorHandler.ts
import { Request, Response, NextFunction } from 'express';
import { ErrorHandlerRegistry } from '../utils/ErrorHandler';

// Create singleton instance
const errorRegistry = new ErrorHandlerRegistry();

/**
 * Global error handler middleware
 */
export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  const formatDate = (date: Date) => {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    const hh = String(date.getHours()).padStart(2, "0");
    const min = String(date.getMinutes()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
  };
  // Log error details
  console.error(`[${formatDate(new Date())}] ${req.method} ${req.path} ${res.statusCode} - Error: ${err.message}`);
  try {
    // Use registry to handle error
    const errorResponse = errorRegistry.handle(err);
    // Send error response
    res.status(errorResponse.statusCode).json({
      error: errorResponse.message
    });
  } catch (handlerError) {
    // If custom error handler fails, pass it to express default handler
    next(handlerError);
  }
}

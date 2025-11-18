/**
 * Custom error class for application-level errors
 * Use this to throw controlled errors with specific HTTP status codes
 * 
 * @example
 * throw new AppError(404, 'User not found');
 * throw new AppError(403, 'Access denied');
 * throw new AppError(409, 'Email already exists');
 */
export class AppError extends Error {
  // readonly protects an instance property
  readonly isAppError = true;  // Marker for error detection

  /**
   * @param statusCode - HTTP status code (400, 404, 500, etc.)
   * @param message - User-friendly error message
   * @param isOperational - Whether this is an expected/operational error (default: true)
   */
  constructor(
    public statusCode: number,
    public message: string,
    public isOperational: boolean = true
  ) {
    super(message);

    // Maintains proper stack trace for where error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }

    // Set prototype explicitly (TypeScript)
    Object.setPrototypeOf(this, AppError.prototype);

    this.name = this.constructor.name;
  }
}

/**
 * 404 Not Found Error
 */
export class NotFoundError extends AppError {
  readonly isAppError = true;

  constructor(resource: string = 'Resource') {
    super(404, `${resource} not found`);
  }
}

/**
 * 400 Bad Request / Validation Error
 */
export class ValidationError extends AppError {
  readonly isAppError = true;

  constructor(message: string) {
    super(400, message);
  }
}

/**
 * 401 Unauthorized Error
 */
export class UnauthorizedError extends AppError {
  readonly isAppError = true;

  constructor(message: string = 'Unauthorized access') {
    super(401, message);
  }
}

/**
 * 403 Forbidden Error
 */
export class ForbiddenError extends AppError {
  readonly isAppError = true;

  constructor(message: string = 'Access forbidden') {
    super(403, message);
  }
}

/**
 * 409 Conflict Error
 */
export class ConflictError extends AppError {
  readonly isAppError = true;

  constructor(message: string) {
    super(409, message);
  }
}

/**
 * 422 Unprocessable Entity Error
 */
export class UnprocessableEntityError extends AppError {
  readonly isAppError = true;

  constructor(message: string) {
    super(422, message);
  }
}

/**
 * 500 Internal Server Error
 */
export class InternalServerError extends AppError {
  readonly isAppError = true;

  constructor(message: string = 'Internal server error') {
    super(500, message, false);  // Not operational
  }
}

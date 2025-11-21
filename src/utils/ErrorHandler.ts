import { HTTP_STATUS } from '../constants/http';
import {
  PG_ERROR_CODES,
  PG_ERROR_MAPPINGS,
  PG_ERROR_DEFAULT,
  CONSTRAINT_MESSAGES,
  PostgresError
} from '../constants/database';

/**
 * Interface for error handling strategies
 */
interface IErrorStrategy {
  canHandle(err: any): boolean;
  handle(err: any): { statusCode: number; message: string };
}

/**
 * Handler for custom AppError and its subclasses
 */
class AppErrorStrategy implements IErrorStrategy {
  canHandle(err: any): boolean {
    return err.isAppError === true;
  }
  handle(err: any): { statusCode: number; message: string } {
    return {
      statusCode: err.statusCode,
      message: err.message
    };
  }
}

/**
 * Handler for PostgreSQL database errors
 */
class DatabaseErrorStrategy implements IErrorStrategy {
  canHandle(err: any): boolean {
    return typeof err.code === 'string' && /^[0-9]{5}$/.test(err.code);
  }

  handle(err: PostgresError): { statusCode: number; message: string } {
    const errorConfig = PG_ERROR_MAPPINGS[err.code!] || PG_ERROR_DEFAULT;
    // Handle dynamic messages
    if (errorConfig.message === 'DYNAMIC') {
      return {
        statusCode: errorConfig.statusCode,
        message: this.getDynamicMessage(err)
      };
    }
    // Handle static messages
    return {
      statusCode: errorConfig.statusCode,
      message: typeof errorConfig.message === 'string'
        ? errorConfig.message
        : errorConfig.message(err)
    };
  }

  private getDynamicMessage(err: PostgresError): string {
    const constraint = err.constraint || '';
    const detail = err.detail || '';
    const column = err.column;
    switch (err.code) {
      case PG_ERROR_CODES.UNIQUE_VIOLATION:
        return this.getUniqueViolationMessage(constraint, detail);
      case PG_ERROR_CODES.FOREIGN_KEY_VIOLATION:
        return this.getForeignKeyViolationMessage(constraint);
      case PG_ERROR_CODES.NOT_NULL_VIOLATION:
        return this.getNotNullViolationMessage(column);
      default:
        return 'Database constraint violation';
    }
  }

  private getUniqueViolationMessage(constraint: string, detail: string): string {
    const lowerConstraint = constraint.toLowerCase();
    // Check constraint mappings
    for (const [key, message] of Object.entries(CONSTRAINT_MESSAGES)) {
      if (lowerConstraint.includes(key.toLowerCase())) {
        return message;
      }
    }
    // Extract field from detail
    const match = detail?.match(/Key \((.+?)\)=/);
    if (match?.[1]) {
      const field = match[1].replace(/_/g, ' ');
      return `${field} already exists`;
    }
    return 'This record already exists';
  }

  private getForeignKeyViolationMessage(constraint: string): string {
    const lowerConstraint = constraint.toLowerCase();
    // Check constraint mappings
    for (const [key, message] of Object.entries(CONSTRAINT_MESSAGES)) {
      if (lowerConstraint.includes(key.toLowerCase())) {
        return message;
      }
    }
    return 'Referenced resource does not exist';
  }

  private getNotNullViolationMessage(column?: string): string {
    if (!column) {
      return 'Required field is missing';
    }
    const fieldName = column.replace(/_/g, ' ');
    return `${fieldName} is required`;
  }
}

/**
 * Handler for Express HTTP errors
 */
class HttpErrorStrategy implements IErrorStrategy {
  canHandle(err: any): boolean {
    return (err.status !== undefined || err.statusCode !== undefined) &&
      typeof (err.status || err.statusCode) === 'number';
  }

  handle(err: any): { statusCode: number; message: string } {
    return {
      statusCode: err.status || err.statusCode,
      message: err.message || 'Request failed'
    };
  }
}

/**
 * Handler for JSON syntax errors
 */
class JsonSyntaxErrorStrategy implements IErrorStrategy {
  canHandle(err: any): boolean {
    return err.name === 'SyntaxError' && 'body' in err;
  }

  handle(err: any): { statusCode: number; message: string } {
    return {
      statusCode: HTTP_STATUS.BAD_REQUEST,
      message: 'Invalid JSON format in request body'
    };
  }
}

/**
 * Handler for validation errors
 */
class ValidationErrorStrategy implements IErrorStrategy {
  canHandle(err: any): boolean {
    return err.name === 'ValidationError' && !err.isAppError;
  }

  handle(err: any): { statusCode: number; message: string } {
    return {
      statusCode: HTTP_STATUS.BAD_REQUEST,
      message: err.message || 'Validation failed'
    };
  }
}

//class JwtErrorStrategy implements IErrorStrategy {}

/**
 * Default fallback handler
 */
class DefaultErrorStrategy implements IErrorStrategy {
  canHandle(err: any): boolean {
    return true;
  }

  handle(err: any): { statusCode: number; message: string } {
    return {
      statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR,
      message: 'Something went wrong'
    };
  }
}

/**
 * Error Handler Registry
 */
export class ErrorHandlerRegistry {
  private strategies: IErrorStrategy[] = [];

  constructor() {
    this.register(new AppErrorStrategy());
    this.register(new DatabaseErrorStrategy());
    this.register(new HttpErrorStrategy());
    this.register(new JsonSyntaxErrorStrategy());
    this.register(new ValidationErrorStrategy());
    //this.register(new JwtErrorStrategy());
    this.register(new DefaultErrorStrategy());
  }

  register(strategy: IErrorStrategy): void {
    this.strategies.push(strategy);
  }

  handle(err: any): { statusCode: number; message: string } {
    for (const strategy of this.strategies) {
      if (strategy.canHandle(err)) {
        return strategy.handle(err);
      }
    }
    return {
      statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR,
      message: 'An unexpected error occurred'
    };
  }
}

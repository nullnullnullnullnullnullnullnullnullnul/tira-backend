import { HTTP_STATUS } from './http';

/**
 * PostgreSQL error codes
 * Reference: https://www.postgresql.org/docs/current/errcodes-appendix.html
 */
export const PG_ERROR_CODES = {
  // Integrity Constraint Violation
  UNIQUE_VIOLATION: '23505',
  FOREIGN_KEY_VIOLATION: '23503',
  NOT_NULL_VIOLATION: '23502',
  CHECK_VIOLATION: '23514',

  // Data Exception
  INVALID_TEXT_REPRESENTATION: '22P02',
  STRING_DATA_RIGHT_TRUNCATION: '22001',
  NUMERIC_VALUE_OUT_OF_RANGE: '22003',

  // Syntax Error or Access Rule Violation
  UNDEFINED_TABLE: '42P01',
  UNDEFINED_COLUMN: '42703',

} as const;

/**
 * Database constraint name mappings to user-friendly messages
 */
export const CONSTRAINT_MESSAGES: Record<string, string> = {
  // Users
  users_username_uq: 'Username already exists',
  users_email_uq: 'Email already exists',

  // Teams
  teams_name_uq: 'Team name already exists',

  // Tags
  tags_name_team_uq: 'Tag name already exists in this team',

  // Task Tags
  task_tags_task_tag_uq: 'Tag already assigned to this task',

  // Foreign Keys - Tasks
  tasks_team_id_fk: 'Team does not exist',
  tasks_assigned_to_fk: 'Assigned user does not exist',
  tasks_created_by_fk: 'Creator user does not exist',

  // Foreign Keys - Comments
  comments_task_id_fk: 'Task does not exist',
  comments_author_id_fk: 'Author does not exist',

  // Foreign Keys - Tags
  tags_team_id_fk: 'Team does not exist',
  task_tags_task_id_fk: 'Task does not exist',
  task_tags_tag_id_fk: 'Tag does not exist',

  // Foreign Keys - Team Members
  team_members_team_id_fk: 'Team does not exist',
  team_members_user_id_fk: 'User does not exist',
};

/**
 * Type for PostgreSQL error objects
 */
export interface PostgresError extends Error {
  code?: string;
  constraint?: string;
  detail?: string;
  column?: string;
  table?: string;
  schema?: string;
}

/**
 * Error handler configuration for PostgreSQL errors
 */
export interface PgErrorConfig {
  statusCode: number;
  message: string | ((err: PostgresError) => string);
}

/**
 * PostgreSQL error code to HTTP response mapping
 */
export const PG_ERROR_MAPPINGS: Record<string, PgErrorConfig> = {
  [PG_ERROR_CODES.UNIQUE_VIOLATION]: {
    statusCode: HTTP_STATUS.CONFLICT,
    message: 'DYNAMIC', // Flag for dynamic message
  },
  [PG_ERROR_CODES.FOREIGN_KEY_VIOLATION]: {
    statusCode: HTTP_STATUS.BAD_REQUEST,
    message: 'DYNAMIC',
  },
  [PG_ERROR_CODES.NOT_NULL_VIOLATION]: {
    statusCode: HTTP_STATUS.BAD_REQUEST,
    message: 'DYNAMIC',
  },
  [PG_ERROR_CODES.CHECK_VIOLATION]: {
    statusCode: HTTP_STATUS.BAD_REQUEST,
    message: 'Data validation failed: Invalid value provided',
  },
  [PG_ERROR_CODES.INVALID_TEXT_REPRESENTATION]: {
    statusCode: HTTP_STATUS.BAD_REQUEST,
    message: 'Invalid data format provided',
  },
  [PG_ERROR_CODES.STRING_DATA_RIGHT_TRUNCATION]: {
    statusCode: HTTP_STATUS.BAD_REQUEST,
    message: 'Input data is too long',
  },
  [PG_ERROR_CODES.NUMERIC_VALUE_OUT_OF_RANGE]: {
    statusCode: HTTP_STATUS.BAD_REQUEST,
    message: 'Numeric value out of range',
  },
  [PG_ERROR_CODES.UNDEFINED_TABLE]: {
    statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR,
    message: 'Database configuration error',
  },
  [PG_ERROR_CODES.UNDEFINED_COLUMN]: {
    statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR,
    message: 'Database configuration error',
  }
};

/**
 * Default error response for unmapped PostgreSQL errors
 */
export const PG_ERROR_DEFAULT: PgErrorConfig = {
  statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR,
  message: 'Database error occurred'
};

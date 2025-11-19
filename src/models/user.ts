import { BaseModel } from './base';

export type UserRole = 'leader' | 'user';

export const validRoles: UserRole[] = ['leader', 'user'];

/**
 * User entity model
 * Extends BaseModel so it can participate in generic operations (pagination, filters, etc.)
 */
export interface User extends BaseModel {
  user_id: string;
  username: string;
  email: string;
  role: UserRole;
  created_at: string; // JSON will use ISOStrings (.toISOString())
  last_login: string | null; // Ej: "2025-09-07T18:00:00"
  pwd_hash: string;
}

type FilterableFields = 'user_id' | 'username' | 'email' | 'role';

/**
 * Filter type limited to the fields the repository can actually query by.
 * Uses a polymorphic Partial<Pick<...>> pattern so the same approach can be
 * reused for other models without adding unused helpers.
 */
export type UserFilter = Partial<Pick<User, FilterableFields>>;

import { BaseModel } from './base';

export type UserRole = 'leader' | 'user';

export const validRoles: UserRole[] = ['leader', 'user'];

/**
 * User entity model
 * Extends BaseModel so it can participate in generic operations (pagination, filters, etc.)
 */
// email is nullable in the schema (see migrations/0002_create-users.sql)
// because the UNIQUE-when-present pattern lets service-account or
// imported users exist without an address. createUser still requires
// an email at the service layer; the nullability only surfaces on
// reads of records that were inserted with NULL out-of-band.
export interface User extends BaseModel {
  user_id: string;
  username: string;
  email: string | null;
  role: UserRole;
  created_at: string; // JSON will use ISOStrings (.toISOString())
  pwd_hash: string;
}

type FilterableFields = 'user_id' | 'username' | 'email' | 'role';

/**
 * Filter type limited to the fields the repository can actually query by.
 * Uses a polymorphic Partial<Pick<...>> pattern so the same approach can be
 * reused for other models without adding unused helpers.
 */
export type UserFilter = Partial<Pick<User, FilterableFields>>;

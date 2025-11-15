import { ulid } from 'ulid';
import bcrypt from "bcrypt";
import * as userRepository from '../repositories/user.repository';
import { User, UserRole, validRoles, UserFilter } from '../models/user';
import { PaginatedResult } from '../models/pagination';

const SALT: number = 10;
export type UserSafe = Omit<User, 'pwd_hash'>;

const usernameRegex: RegExp = /^[a-z0-9]{3,16}$/i;
const emailRegex: RegExp = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i;
const passwordRegex: RegExp = /^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9]).{8,16}$/;

// Role can be 'leader' or 'user' only
function isValidRole(role: string): role is UserRole {
  return validRoles.includes(role as UserRole);
}

// Usernames:
// - Between 3 and 16 characters long
// - Only letters and numbers allowed
function isValidUsername(username: string): boolean {
  return usernameRegex.test(username);
}

// Emails:
// - In local part allows alphanumeric characters and '._%+-'
// - Allows multiple subdomains in the domain part (any.edu.ar)
// - Each domain label need to start/end with a letter/number
// - Top-level domain should be atleast 2 characters long
function isValidEmail(email: string): boolean {
  return emailRegex.test(email);
}

// Passwords:
// - Between 8 and 16 characters long
// - Atleast 1 number
// - Atleast 1 uppercase letter
// - Atleast 1 lowercase letter
// - Atleast 1 special character (any non-alphanumeric)
function isValidPassword(pwd: string): boolean {
  return passwordRegex.test(pwd);
}

// Lists all users, filters by username, id, email, role
// todo: validate permission to view all user data
export async function listUsers(
  filter: UserFilter = {},
  page: number = 1,
  pageSize: number = 20
): Promise<PaginatedResult<UserSafe>> {
  const result: PaginatedResult<User> = await userRepository.selectUsers(filter, page, pageSize);
  const safe: UserSafe[] = result.data.map(({ pwd_hash, ...safe }) => safe);
  return {
    data: safe,
    pagination: result.pagination
  };
}

// Add user
export async function insertUser(
  fields:
    {
      username: string;
      email: string;
      role: string;
      password: string
    }
): Promise<UserSafe> {
  if (!isValidRole(fields.role)) throw new Error('Invalid role');
  if (!isValidUsername(fields.username)) throw new Error('Invalid username');
  if (!isValidEmail(fields.email)) throw new Error('Invalid email address');
  if (!isValidPassword(fields.password)) throw new Error('Invalid password');
  const pwd_hash: string = await bcrypt.hash(fields.password, SALT);
  const newUser: User = {
    user_id: ulid(),
    username: fields.username,
    email: fields.email,
    role: fields.role,
    created_at: new Date().toISOString(),
    last_login: null,
    pwd_hash: pwd_hash
  }
  const inserted: User = await userRepository.insertUser(newUser);
  if (!inserted) throw new Error('Failed to create user');
  const { pwd_hash: _, ...safe } = inserted;
  return safe;
}

// Deletes user
// todo: validate permission to delete user's data
export async function deleteUser(user_id: string): Promise<boolean> {
  const result = await listUsers({ user_id: user_id }, 1, 1);
  if (result.data.length === 0) throw new Error('User not found');
  const deleted: boolean = await userRepository.deleteUser(user_id);
  if (!deleted) throw new Error('Failed to delete user');
  return deleted;
}

// Update username
// todo: validate permission to update user's data
export async function updateUser(
  user_id: string,
  fields: { username?: string; email?: string, password?: string; }
): Promise<UserSafe> {
  if (!fields) throw new Error('No fields given to update');
  // Checks user existence
  const user = await userRepository.selectUsers({ user_id: user_id }, 1, 1);
  if (!user) throw new Error('User not found');
  const updates: Partial<User> = {};
  if (fields.username) {
    if (!isValidUsername(fields.username)) throw new Error('Invalid username format');
    updates.username = fields.username;
  }
  if (fields.email) {
    if (!isValidEmail(fields.email)) throw new Error('Invalid email format');
    updates.email = fields.email;
  }
  if (fields.password) {
    if (!isValidPassword(fields.password)) throw new Error('Invalid password');
    updates.pwd_hash = await bcrypt.hash(fields.password, SALT);
  }
  const updatedUser: User | null = await userRepository.updateUser(user_id, updates);
  if (!updatedUser) throw new Error('Failed to update user data');
  const { pwd_hash: _, ...safe } = updatedUser;
  return safe;
}

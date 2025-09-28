import { ulid } from 'ulid';
import bcrypt from "bcrypt";
import * as userRepository from '../repositories/user.repository';
import { User, UserRole, validRoles, UserFilter } from '../models/user';

const SALT = 10;

// HELPERS
const usernameRegex = /^[a-z0-9]{3,16}$/i;
const emailRegex = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i;
const passwordRegex = /^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9]).{8,16}$/;

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
export async function listUsers(
  filter: UserFilter = {},
  offset: number = 0,
  limit: number = 20
): Promise<Omit<User, 'pwd_hash'>[]> {
  const users = await userRepository.selectUsers(filter, offset, limit);
  return users.map(({ pwd_hash, ...safe }) => safe);
}

// Add user
export async function insertUser(
  fields:
    {
      username: string;
      email: string;
      role: string;
      password: string
    }): Promise<User | null> {
  if (!isValidRole(fields.role)) throw new Error('Invalid role');
  if (!isValidUsername(fields.username)) throw new Error('Invalid username');
  if (!isValidEmail(fields.email)) throw new Error('Invalid email address');
  if (!isValidPassword(fields.password)) throw new Error('Invalid password');
  const pwd_hash = await bcrypt.hash(fields.password, SALT);
  const newUser: User = {
    user_id: ulid(),
    username: fields.username,
    email: fields.email,
    role: fields.role,
    created_at: new Date().toISOString(),
    last_login: null,
    pwd_hash: pwd_hash
  }
  return await userRepository.insertUser(newUser);
}

// Deletes user
export async function deleteUser(user_id: string): Promise<boolean> {
  const user: Omit<User, "pwd_hash">[] = await listUsers({ id: user_id }, 0, 1);
  if (user.length === 0) throw new Error('User not found');
  return userRepository.deleteUser(user_id);
}

// Update username
export async function updateUser(
  user_id: string,
  fields: { username?: string; email?: string, password?: string; }
): Promise<Omit<User, 'pwd_hash'> | null> {
  if (!fields) throw new Error('No fields given to update');
  // Checks user existence
  const user = await userRepository.selectUsers({ id: user_id }, 0, 1);
  if (user.length === 0) throw new Error('User not found');
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
  const updatedUser = await userRepository.updateUser(user_id, updates);
  return updatedUser ? (({ pwd_hash, ...safe }) => safe)(updatedUser) : null;
}

import { ulid } from 'ulid';
import bcrypt from "bcrypt";
import * as userRepository from '../repositories/user.repository';
import { User, UserRole, validRoles } from '../models/user';

const SALT = 10;
function isValidRole(role: string): role is UserRole {
  return validRoles.includes(role as UserRole);
}

// Lists all users, optionally filters by username
export async function listAllUsers(filterName?: string): Promise<Omit<User, 'pwd_hash'>[]> {
  const users = await userRepository.listAllUsers(filterName);
  return users.map(({ pwd_hash, ...safe }) => safe);
}

// Searchs user with exact id
export async function getUserById(id: string): Promise<Omit<User, 'pwd_hash'> | null> {
  const user = await userRepository.getUserById(id);
  if (!user) return null;
  const { pwd_hash, ...safe } = user;
  return safe;
}

export async function insertUser(input: { username: string; email: string; role: string; password: string }): Promise<User | null> {
  if (!isValidRole(input.role)) return null;
  const pwd_hash = await bcrypt.hash(input.password, SALT);
  const newUser: User = {
    user_id: ulid(),
    username: input.username,
    email: input.email,
    role: input.role,
    created_at: new Date().toISOString(),
    last_login: null,
    pwd_hash: pwd_hash
  }
  return await userRepository.insertUser(newUser);
}

export async function deleteUser(id: string): Promise<boolean> {
  return userRepository.deleteUser(id);
}

// Update username
export async function updateUsername(name: string, user_id: string): Promise<User> {
  if (!name.trim()) throw new Error('Username cannot be empty');
  const user = await userRepository.getUserById(user_id);
  if (!user) throw new Error('Username not found');
  return await userRepository.updateUsername(name, user_id);
}
import { Request, Response } from "express";
import { UserFilter, UserRole } from '../models/user';
import * as userService from '../services/users.service';
import { UserSafe } from "../services/users.service";

// Models
interface ListUsersQuery {
  username?: string;
  email?: string;
  role?: UserRole;
  id?: string;
  offset?: number;
  limit?: number;
}

interface CreateUserBody {
  username: string;
  email: string;
  role: UserRole;
  password: string;
}

interface UpdateUserBody {
  username?: string;
  email?: string;
  password?: string;
}

interface UserIdParams {
  id: string;
}

// GET /users?username=&email=&role=&id=&offset=&limit=
export async function listUsers(
  req: Request<{}, {}, {}, ListUsersQuery>,
  res: Response<UserSafe[] | { error: string }>
) {
  try {
    const { username, email, role, id, offset, limit } = req.query;
    const filter: UserFilter = {};
    if (username) filter.username = String(username);
    if (email) filter.email = String(email);
    if (role) filter.role = String(role) as UserRole;
    if (id) filter.id = String(id);
    const users: UserSafe[] = await userService.listUsers(
      filter,
      Number(offset) || 0,
      Number(limit) || 20
    );
    res.json(users);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

// POST /users
export async function createUser(
  req: Request<{}, {}, CreateUserBody>,
  res: Response<UserSafe | { error: string }>
) {
  try {
    const { username, email, role, password } = req.body;
    const newUser: UserSafe = await userService.insertUser({ username, email, role, password });
    // Nunca será null si el service lanza error al fallar
    res.status(201).json(newUser);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
}

// DELETE /users/:id
export async function deleteUser(
  req: Request<UserIdParams>,
  res: Response<{} | { error: string }>
) {
  try {
    const { id } = req.params;
    const deleted: boolean = await userService.deleteUser(id);
    if (!deleted) return res.status(404).json({ error: 'User not found'});
    res.status(204).send();
  } catch (err: any) {
    res.status(404).json({ error: err.message });
  }
}

// PATCH /users/:id
export async function updateUser(
  req: Request<UserIdParams, {}, UpdateUserBody>,
  res: Response<UserSafe | { error: string }>
) {
  try {
    const { id } = req.params;
    const { username, email, password } = req.body;
    const fields: UpdateUserBody = {};
    if (Object.keys(fields).length === 0) {
      return res.status(400).json({ error: "No fields provided to update" });
    }
    if (username) fields.username = username;
    if (email) fields.email = email;
    if (password) fields.password = password;
    const updatedUser: UserSafe = await userService.updateUser(id, fields);
    res.json(updatedUser);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
}

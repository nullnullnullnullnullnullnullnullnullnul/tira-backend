import { Request, Response } from "express";
import { UserFilter, UserRole } from '../models/user';
import * as userService from '../services/users.service';
import { UserSafe } from "../services/users.service";
import {
  ListUsersQuery,
  CreateUserBody,
  UpdateUserBody,
  DeleteUserParams,
  UpdateUserParams
} from '../dto/user.dto';

// GET /users?username=&email=&role=&user_id=&offset=&limit=
export async function listUsers(
  req: Request<{}, {}, {}, ListUsersQuery>,
  res: Response<UserSafe[] | { error: string }>
) {
  try {
    const { username, email, role, user_id, offset, limit } = req.query;
    const filter: UserFilter = {};
    if (username) filter.username = String(username);
    if (email) filter.email = String(email);
    if (role) filter.role = String(role) as UserRole;
    if (user_id) filter.user_id = String(user_id);
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

// DELETE /users/:user_id
export async function deleteUser(
  req: Request<DeleteUserParams>,
  res: Response<{} | { error: string }>
) {
  try {
    const { user_id } = req.params;
    const deleted: boolean = await userService.deleteUser(user_id);
    if (!deleted) return res.status(404).json({ error: 'User not found' });
    res.status(204).send();
  } catch (err: any) {
    res.status(404).json({ error: err.message });
  }
}

// PATCH /users/:user_id
export async function updateUser(
  req: Request<UpdateUserParams, {}, UpdateUserBody>,
  res: Response<UserSafe | { error: string }>
) {
  try {
    const { user_id } = req.params;
    const { username, email, password } = req.body;
    const fields: UpdateUserBody = {};
    if (username) fields.username = username;
    if (email) fields.email = email;
    if (password) fields.password = password;
    if (Object.keys(fields).length === 0) {
      return res.status(400).json({ error: "No fields provided to update" });
    }
    const updatedUser: UserSafe = await userService.updateUser(user_id, fields);
    res.json(updatedUser);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
}

import { Request, Response } from "express";
import { User, UserFilter, UserRole } from '../models/user';
import * as userService from '../services/users.service';

// GET /users?username=&email=&role=&id=&offset=&limit=
export async function listUsers(req: Request, res: Response) {
  try {
    const { username, email, role, id, offset, limit } = req.query;
    const filter: UserFilter = {};
    if (username) filter.username = String(username);
    if (email) filter.email = String(email);
    if (role) filter.role = String(role) as UserRole;
    if (id) filter.id = String(id);
    const users = await userService.listUsers(
      filter,
      Number(offset) || 0,
      Number(limit) || 20
    );
    return res.json(users);
  } catch (e) {
    console.error(e);
    res.status(500).json({
      error: e instanceof Error ? e.message : String(e),
    });
  }
}

// POST /users
export async function createUser(req: Request, res: Response) {
  try {
    const { username, email, role, password } = req.body;
    const newUser = await userService.insertUser({ username, email, role, password });
    if (!newUser) throw new Error("Error creating user");  // // Should be in src/middlewares.ts
    const { pwd_hash, ...safe } = newUser;
    res.status(201).json(safe);
  } catch (e) {
    console.error(e);
    res.status(500).json({
      error: e instanceof Error ? e.message : String(e)
    });
  }
}

// DELETE /users/:id
export async function deleteUser(req: Request, res: Response) {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: "User id is required" });
    const deleted = await userService.deleteUser(id);
    if (!deleted) throw new Error("User not found"); // // Should be in src/middlewares.ts
    res.status(204).send(); // no content
  } catch (e) {
    console.error(e);
    res.status(500).json({
      error: e instanceof Error ? e.message : String(e)
    });
  }
}

// PATCH /users/:id
export async function updateUser(req: Request, res: Response) {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: "User id is required" });
    const { username, email, password, } = req.body;
    const fields: {
      username?: string;
      email?: string;
      password?: string;
    } = {};
    if (username) fields.username = username;
    if (email) fields.email = email;
    if (password) fields.password = password;
    if (Object.keys(fields).length === 0) {
      return res.status(400).json({ error: "No fields provided to update" });
    }
    const updatedUser = await userService.updateUser(id, fields);
    res.json(updatedUser);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
}

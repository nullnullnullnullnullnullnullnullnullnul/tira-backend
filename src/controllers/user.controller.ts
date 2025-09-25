import { Request, Response } from "express";
import * as userService from '../services/users.service';

// GET /users?username=something
export async function listUsers(req: Request, res: Response) {
  try {
    const { username } = req.query; // extract from querystring, uses .query because its optional
    const users = await userService.listAllUsers(username as string | undefined);
    if (users.length > 0) res.json(users);
    else throw new Error("No users found");  // Should be in src/middlewares.ts
  } catch (e) {
    console.error(e);
    res.status(500).json({
      error: e instanceof Error ? e.message : String(e),
    });
  }
}

// GET /users/:id, uses .params because id is not optional
export async function getUser(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const users = await userService.getUserById(id as string);
    if (!users) throw new Error("User not found"); // // Should be in src/middlewares.ts
    res.json(users);
  } catch (e) {
    console.error(e);
    res.status(500).json({
      error: e instanceof Error ? e.message : String(e)
    });
  }
}

// POST /users, POST, PUT and PATCH uses .body
export async function createUser(req: Request, res: Response) {
  try {
    const { username, email, role, password } = req.body;
    const newUser = await userService.insertUser({ username, email, role, password });
    if (!newUser) throw new Error("Invalid role");  // // Should be in src/middlewares.ts
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
    const deleted = await userService.deleteUser(id as string);
    if (!deleted) throw new Error("User not found"); // // Should be in src/middlewares.ts
    res.status(204).send(); // no content
  } catch (e) {
    console.error(e);
    res.status(500).json({
      error: e instanceof Error ? e.message : String(e)
    });
  }
}
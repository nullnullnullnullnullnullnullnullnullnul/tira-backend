import { Request, Response, NextFunction } from "express";
import { UserFilter, UserRole } from '../models/user';
import * as userService from '../services/users.service';
import { UserSafe } from "../services/users.service";
import { PaginatedResult } from "../models/pagination";
import { parsePaginationQuery } from "../dto/pagination.dto";
import { ValidationError } from "../utils/AppError";
import {
  ListUsersQuery,
  CreateUserBody,
  UpdateUserBody,
  DeleteUserParams,
  UpdateUserParams
} from '../dto/user.dto';

// GET /users?username=&email=&role=&user_id=&page=&pageSize=
export async function listUsers(
  req: Request<{}, {}, {}, ListUsersQuery, {}>,
  res: Response<PaginatedResult<UserSafe>>,
  next: NextFunction
) {
  try {
    const { username, email, role, user_id } = req.query;
    const { page, pageSize } = parsePaginationQuery(req.query);
    const filter: UserFilter = {
      ...(username && { username }),
      ...(email && { email }),
      ...(role && { role: role as UserRole }),
      ...(user_id && { user_id })
    };
    const users = await userService.listUsers(
      filter,
      page,
      pageSize
    );
    res.json(users);
  } catch (err) {
    next(err);
  }
}

// POST /users
export async function createUser(
  req: Request<{}, {}, CreateUserBody, {}, {}>,
  res: Response<UserSafe>,
  next: NextFunction
) {
  try {
    const { username, email, role, password } = req.body;
    const newUser: UserSafe = await userService.insertUser({ username, email, role, password });
    res.status(201).json(newUser);
  } catch (err) {
    next(err);
  }
}

// DELETE /users/:user_id
export async function deleteUser(
  req: Request<DeleteUserParams, {}, {}, {}, {}>,
  res: Response,
  next: NextFunction
) {
  try {
    const { user_id } = req.params;
    await userService.deleteUser(user_id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

// PATCH /users/:user_id
export async function updateUser(
  req: Request<UpdateUserParams, {}, UpdateUserBody, {}, {}>,
  res: Response<UserSafe>,
  next: NextFunction
) {
  try {
    const { user_id } = req.params;
    const { username, email, password } = req.body;
    const fields: UpdateUserBody = {
      ...(username && { username }),
      ...(email && { email }),
      ...(password && { password })
    };
    if (Object.keys(fields).length === 0) {
      throw new ValidationError("No fields provided to update");
    }
    const updatedUser: UserSafe = await userService.updateUser(user_id, fields);
    res.json(updatedUser);
  } catch (err) {
    next(err);
  }
}

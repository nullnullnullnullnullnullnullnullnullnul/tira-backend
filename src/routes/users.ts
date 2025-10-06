import { Router } from 'express';
import * as userController from '../controllers/user.controller';
import { requireBody } from "../validators/requireBody";
import { requireParams } from '../validators/requireParams';
import { DeleteUserParams, UpdateUserParams } from '../dto/user.dto';

const router = Router();

// List users with optional filters
// GET /users?username=&email=&role=&user_id=&offset=&limit=
router.get('/', userController.listUsers);

// Create a new user - POST /users
router.post(
  '/',
  requireBody(['username', 'email', 'role', 'password']),
  userController.createUser
);

// Delete user - DELETE /users/:user_id
router.delete(
  '/:user_id',
  requireParams<DeleteUserParams>(['user_id']),
  userController.deleteUser
);

// Update user (username, email, password) - PATCH /users/:user_id
router.patch(
  '/:user_id',
  requireParams<UpdateUserParams>(['user_id']),
  userController.updateUser
);

export default router;

import { Router } from "express";
import * as userController from '../controllers/user.controller';
import { requireFields } from "../validators/requireFields";

const router = Router();

// List users with optional filters
// GET /users?username=&email=&role=&id=&offset=&limit=
router.get('/', userController.listUsers);

// Create a new user - POST /users
router.post(
  '/',
  requireFields(['username', 'email', 'role', 'password']),
  userController.createUser
);

// Delete user - DELETE /users/:user_id
router.delete('/:id', userController.deleteUser);

// Update user (username, email, password) - PATCH /users/:user_id
router.patch('/:id', userController.updateUser);

export default router;

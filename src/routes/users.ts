import { Router } from "express";
import * as userController from '../controllers/user.controller';
import { requireFields } from "../validators/requireFields";

const router = Router();

router.get("/", userController.listUsers);
router.get("/:id", userController.getUser);
router.post("/", requireFields(["username", "email", "role"]), userController.createUser);
router.delete("/:id", userController.deleteUser);
router.patch("/:user_id/username", requireFields(["name"]), userController.updateUsername);
export default router;

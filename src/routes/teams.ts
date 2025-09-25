import { Router } from "express";
import * as teamController from "../controllers/team.controller";
import { requireFields } from "../validators/requireFields";

const router = Router();

router.post("/", requireFields(["owner_id", "name"]), teamController.createTeam);
router.get("/user/:user_id", teamController.getUserTeams);
router.get("/:team_id/details/:user_id", teamController.getTeamDetails);
router.patch("/:team_id", requireFields(["name", "user_id"]), teamController.updateTeamName);
router.post("/:team_id/members", requireFields(["userToAddId", "requestingUserId"]), teamController.addUserToTeam);
router.delete("/:team_id/members/:user_id/:performed_by", teamController.removeUserFromTeam);
router.get("/:team_id/tasks", teamController.getTeamTasks);
router.delete("/:team_id", teamController.deleteTeam);
router.get("/:team_id/members", teamController.getTeamMembers);

export default router;

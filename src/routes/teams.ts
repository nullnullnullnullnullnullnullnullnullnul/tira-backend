import { Router } from 'express';
import * as teamController from '../controllers/team.controller';
import { requireBody } from '../validators/requireBody';
import { requireParams } from '../validators/requireParams';
import {
  GetUserTeamsParams,
  UpdateTeamParams,
  AddUserToTeamParams,
  RemoveUserFromTeamParams,
  ListTeamMembersParams,
  DeleteTeamParams
} from '../dto/team.dto';

const router = Router();

// Create team
router.post(
  '/',
  requireBody(['owner_id', 'name']),
  teamController.createTeam
);

// Get teams a user is in
router.get(
  '/user/:user_id',
  requireParams<GetUserTeamsParams>(['user_id']),
  teamController.getUserTeams
);

// Update team
router.patch(
  '/:team_id',
  requireParams<UpdateTeamParams>(['team_id']),
  requireBody(['name']),
  teamController.updateTeam
);

// Add user to team
router.post(
  '/:team_id/members',
  requireParams<AddUserToTeamParams>(['team_id']),
  requireBody(['user_id']),
  teamController.addUserToTeam
);

// Remove user from team
router.delete(
  '/:team_id/members/:user_id',
  requireParams<RemoveUserFromTeamParams>(['team_id', 'user_id']),
  teamController.removeUserFromTeam
);

// Lists team members
router.get(
  '/:team_id/members',
  requireParams<ListTeamMembersParams>(['team_id']),
  teamController.listTeamMembers
);

// Removes a team
router.delete(
  '/:team_id',
  requireParams<DeleteTeamParams>(['team_id']),
  teamController.deleteTeam
);

export default router;

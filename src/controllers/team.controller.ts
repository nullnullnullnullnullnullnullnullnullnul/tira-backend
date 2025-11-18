import { Request, Response, NextFunction } from 'express';
import * as teamService from '../services/teams.service';
import { Team, TeamMember } from '../models/team';
import { User } from '../models/user';
import { PaginatedResult } from '../models/pagination';
import { parsePaginationQuery } from '../dto/pagination.dto';
import {
  GetUserTeamsParams,
  UpdateTeamParams,
  AddUserToTeamParams,
  RemoveUserFromTeamParams,
  ListTeamMembersParams,
  DeleteTeamParams,
  UpdateTeamBody,
  AddUserToTeamBody,
  CreateTeamBody,
  GetUserTeamsQuery,
  ListTeamMembersQuery
} from '../dto/team.dto';

// POST /teams
export async function createTeam(
  req: Request<{}, {}, CreateTeamBody, {}, {}>,
  res: Response<Team>,
  next: NextFunction
) {
  try {
    const { owner_id, name } = req.body;
    const team = await teamService.createTeam(owner_id, { name });
    res.status(201).json(team);
  } catch (err) {
    next(err);
  }
}

// GET /teams/users/:user_id?page=&pageSize=
export async function getUserTeams(
  req: Request<GetUserTeamsParams, {}, {}, GetUserTeamsQuery, {}>,
  res: Response<PaginatedResult<Team>>,
  next: NextFunction
) {
  try {
    const { user_id } = req.params;
    const { page, pageSize } = parsePaginationQuery(req.query);
    const teams = await teamService.getUserTeams(user_id, page, pageSize);
    res.json(teams);
  } catch (err) {
    next(err);
  }
}

// PATCH /teams/:team_id
export async function updateTeam(
  req: Request<UpdateTeamParams, {}, UpdateTeamBody, {}, {}>,
  res: Response<Team>,
  next: NextFunction
) {
  try {
    const { team_id } = req.params;
    const { name } = req.body;
    const team = await teamService.updateTeam(team_id, { name });
    res.json(team);
  } catch (err) {
    next(err);
  }
}

// POST /teams/:team_id/members
export async function addUserToTeam(
  req: Request<AddUserToTeamParams, {}, AddUserToTeamBody, {}, {}>,
  res: Response<TeamMember>,
  next: NextFunction
) {
  try {
    const { team_id } = req.params;
    const { user_id } = req.body;
    const member = await teamService.addUserToTeam(team_id, user_id);
    res.status(201).json(member);
  } catch (err) {
    next(err);
  }
}

// DELETE /teams/:team_id/members/:user_id
// res undefined, 204 has no body
export async function removeUserFromTeam(
  req: Request<RemoveUserFromTeamParams, {}, {}, {}, {}>,
  res: Response,
  next: NextFunction
) {
  try {
    const { team_id, user_id } = req.params;
    await teamService.deleteTeamMember(team_id, user_id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

// GET /teams/:team_id/members?page=&pageSize=
export async function listTeamMembers(
  req: Request<ListTeamMembersParams, {}, {}, ListTeamMembersQuery, {}>,
  res: Response<PaginatedResult<User>>,
  next: NextFunction
) {
  try {
    const { team_id } = req.params;
    const { page, pageSize } = parsePaginationQuery(req.query);
    const members = await teamService.listTeamMembers(team_id, page, pageSize);
    res.json(members);
  } catch (err) {
    next(err);
  }
}

// DELETE /teams/:team_id
export async function deleteTeam(
  req: Request<DeleteTeamParams, {}, {}, {}, {}>,
  res: Response<{ success: true }>,
  next: NextFunction
) {
  try {
    const { team_id } = req.params;
    await teamService.deleteTeam(team_id);
    res.status(200).json({ success: true });
  } catch (err) {
    next(err);
  }
}

import { Request, Response } from 'express';
import * as teamService from '../services/teams.service';
import { Team, TeamMember } from '../models/team';
import { User } from '../models/user';

// Models, Request<Params, ResBody, ReqBody, ReqQuery>
export interface GetUserTeamsParams extends Record<string, string>{
  user_id: string;
}
export interface UpdateTeamParams extends Record<string, string> {
  team_id: string;
}
export interface AddUserToTeamParams extends Record<string, string>{
  team_id: string;
}
export interface RemoveUserFromTeamParams extends Record<string, string>{
  team_id: string;
  user_id: string;
}
export interface ListTeamMembersParams extends Record<string, string>{
  team_id: string;
}
export interface DeleteTeamParams extends Record<string, string>{
  team_id: string;
}
interface UpdateTeamBody { name: string }
interface AddUserToTeamBody { user_id: string }
interface CreateTeamBody { owner_id: string; name: string; }

// POST /teams
export async function createTeam(
  req: Request<{}, {}, CreateTeamBody>,
  res: Response<Team | { error: string }>
) {
  try {
    const { owner_id, name } = req.body;
    const team = await teamService.createTeam(owner_id, { name });
    res.status(201).json(team);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
}

// GET /teams/users/:user_id
export async function getUserTeams(
  req: Request<GetUserTeamsParams>,
  res: Response<Team[] | { error: string }>
) {
  try {
    const { user_id } = req.params;
    const teams = await teamService.getUserTeams(user_id);
    res.json(teams);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
}

// PATCH /teams/:team_id
export async function updateTeam(
  req: Request<UpdateTeamParams, {}, UpdateTeamBody>,
  res: Response<Team | { error: string }>
) {
  try {
    const { team_id } = req.params;
    const { name } = req.body;
    const team = await teamService.updateTeam(team_id, { name });
    res.json(team);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
}

// POST /teams/:team_id/members
export async function addUserToTeam(
  req: Request<AddUserToTeamParams, {}, AddUserToTeamBody>,
  res: Response<TeamMember | { error: string }>
) {
  try {
    const { team_id } = req.params;
    const { user_id } = req.body;
    const member = await teamService.addUserToTeam(team_id, user_id);
    res.status(201).json(member);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
}

// DELETE /teams/:team_id/members/:user_id
// res undefined, 204 has no body
export async function removeUserFromTeam(
  req: Request<RemoveUserFromTeamParams>,
  res: Response<undefined | { error: string }>
) {
  try {
    const { team_id, user_id } = req.params;
    const success = await teamService.deleteTeamMember(team_id, user_id);
    if (!success) return res.status(404).json({ error: "Member not found" });
    res.status(204).send();
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
}

// GET /teams/:team_id/members
export async function listTeamMembers(
  req: Request<ListTeamMembersParams>,
  res: Response<User[] | { error: string }>
) {
  try {
    const { team_id } = req.params;
    const members = await teamService.listTeamMembers(team_id);
    res.json(members);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
}

// DELETE /teams/:team_id
export async function deleteTeam(
  req: Request<DeleteTeamParams>,
  res: Response<{ success: true } | { error: string }>
) {
  try {
    const { team_id } = req.params;
    const success = await teamService.deleteTeam(team_id);
    if (!success) return res.status(404).json({ error: 'Team not found' });
    res.status(200).json({ success: true });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
}

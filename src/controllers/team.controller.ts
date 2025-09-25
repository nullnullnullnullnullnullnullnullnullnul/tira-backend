import { Request, Response } from 'express';
import * as teamService from '../services/teams.service';
import { UserRole } from '../models/user';

// POST /teams
export async function createTeam(req: Request, res: Response) {
  try {
    const { owner_id, name } = req.body;
    const team = await teamService.createTeam(owner_id, name);
    res.status(201).json(team);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
}

// GET /users/:user_id/teams
export async function getUserTeams(req: Request, res: Response) {
  try {
    const { user_id } = req.params;
    const teams = await teamService.getUserTeams(user_id as string);
    res.json(teams);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
}

// GET /teams/:user_id/details
export async function getTeamDetails(req: Request, res: Response) {
  try {
    const { user_id } = req.params;
    const details = await teamService.getTeamDetails(user_id as string);
    res.json(details);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
}

// PATCH /teams/:team_id
export async function updateTeamName(req: Request, res: Response) {
  try {
    const { team_id } = req.params;
    const { name, user_id } = req.body;
    const team = await teamService.updateTeamName(team_id as string, name, user_id);
    res.json(team);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
}

// POST /teams/:team_id/members
export async function addUserToTeam(req: Request, res: Response) {
  try {
    const { team_id } = req.params;
    const { userToAddId, requestingUserId, role } = req.body;
    const member = await teamService.addUserToTeam(team_id as string, userToAddId, requestingUserId, role as UserRole);
    res.status(201).json(member);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
}

// DELETE /teams/:team_id/members/:user_id
export async function removeUserFromTeam(req: Request, res: Response) {
  try {
    const { team_id, user_id, performed_by } = req.params; // <-- usar params
    const result = await teamService.removeUserFromTeam(team_id as string, user_id as string, performed_by as string);
    res.status(204).send(); // mejor que enviar { success: true }
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
}

// GET /teams/:team_id/members?user_id=
export async function getTeamMembers(req: Request, res: Response) {
  try {
    const { team_id } = req.params;
    const { user_id } = req.query;
    const members = await teamService.getTeamMembers(team_id as string, user_id as string);
    res.json(members);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
}

// GET /teams/:team_id/tasks?user_id=
export async function getTeamTasks(req: Request, res: Response) {
  try {
    const { team_id } = req.params;
    const { user_id } = req.query;
    const tasks = await teamService.getTeamTasks(team_id as string, user_id as string);
    res.json(tasks);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
}

// DELETE /teams/:team_id
export async function deleteTeam(req: Request, res: Response) {
  try {
    const { team_id } = req.params;
    const { user_id } = req.body; // el owner que intenta eliminar
    const result = await teamService.deleteTeam(team_id as string, user_id as string);
    res.json({ success: result });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
}

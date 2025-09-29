import { ulid } from 'ulid';
import * as teamRepository from '../repositories/team.repository';
import * as userRepository from '../repositories/user.repository';
import { Team, Invite, TeamMember } from '../models/team';
import { User, UserRole, validRoles } from '../models/user';

const teamNameRegex = /^[A-Za-z0-9 _-]{3,50}$/;

// Team name:
// - Between 3 and 50 (inclusive) characters long
// - only letters, numbers and " ", "-" allowed
function isValidTeamName(name: string): boolean {
  return teamNameRegex.test(name);
}

// Create a team
export async function createTeam(
  owner_id: string,
  fields: Omit<Team, "team_id" | "owner_id" | "created_at">
): Promise<Team> {
  if (!isValidTeamName(fields.name)) throw new Error('Invalid team name');
  // Checks if owner exists and has leader role
  const owner = (await userRepository.selectUsers({ user_id: owner_id }, 0, 1))[0];
  if (!owner) throw new Error('User not found');
  if (owner.role !== 'leader') throw new Error('User lacks permissions');
  // Creates team
  const team: Team = {
    team_id: ulid(),
    owner_id,
    name: fields.name,
    created_at: new Date().toISOString(),
  };
  const newTeam = await teamRepository.insertTeam(team);
  if (!newTeam) throw new Error('Error creating the team');
  // Inserts the owner as the first member of the team
  await addUserToTeam(team.team_id, owner_id);
  return newTeam;
}

// Get all groups a user belongs to 
// todo: validate permission to view all groups a user belongs to
export async function getUserTeams(user_id: string): Promise<Team[]> {
  return await teamRepository.selectTeamsByUser(user_id);
}

// Update team name
// todo: validate permission to update team data
export async function updateTeam(
  team_id: string,
  fields: Partial<Omit<Team, "team_id" | "owner_id" | "created_at">>
): Promise<Team> {
  if (!fields.name) throw new Error('No fields to update')
  if (!isValidTeamName(fields.name)) throw new Error('Invalid team name');
  const team = (await teamRepository.selectTeams({ id: team_id }, 0, 1))[0];
  if (!team) throw new Error('Team not found');
  const updated = await teamRepository.updateTeam(team_id, fields);
  if (!updated) throw new Error('Error updating team');
  return updated;
}

// Add user to team
// todo: validate permission to add user to a team
export async function addUserToTeam(
  team_id: string,
  user_id: string,
): Promise<TeamMember> {
  // User exists
  const user = (await userRepository.selectUsers({ user_id: user_id }, 0, 1))[0];
  if (!user) throw new Error('User not found');
  if (!validRoles.includes(user.role as UserRole)) throw new Error('Invalid role');
  // Team exists
  const team = (await teamRepository.selectTeams({ id: team_id }, 0, 1))[0];
  if (!team) throw new Error('Team not found');
  // User is not a member of the team
  const members = await teamRepository.selectMembers(team_id);
  if (members.find(m => m.user_id === user_id)) throw new Error('User is already in the team');
  const invite: Invite = {
    team_members_id: ulid(),
    team_id,
    user_id,
    role: user.role,
    invited_at: new Date().toISOString(),
    joined_at: new Date().toISOString(),
  };
  const member = await teamRepository.insertTeamMember(invite);
  if (!member) throw new Error('Error adding user to team');
  return member;
}

// Delete user from team
// todo: validate permission to delete user from a team
export async function deleteTeamMember(team_id: string, user_id: string): Promise<boolean> {
  const team = (await teamRepository.selectTeams({ id: team_id }, 0, 1))[0];
  if (!team) throw new Error('Team not found');
  return await teamRepository.deleteTeamMember(user_id, team_id);
}

// Lists users from team
// todo: validate permission to view all users of a team
export async function listTeamMembers(team_id: string): Promise<User[]> {
  return await teamRepository.selectMembers(team_id);
}

// Delete team
// todo: validate permission to delete a team
export async function deleteTeam(team_id: string): Promise<boolean> {
  const team = (await teamRepository.selectTeams({ id: team_id }, 0, 1))[0];
  if (!team) throw new Error('Team not found');
  return await teamRepository.deleteTeam(team_id);
}

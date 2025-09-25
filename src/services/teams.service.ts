import { ulid } from 'ulid';
import * as teamRepository from '../repositories/team.repository';
import * as userRepository from '../repositories/user.repository';
import { Team, Invite, TeamMember, TeamTask, TeamRow } from '../models/team';
import { UserRole } from '../models/user';

// Create a team
export async function createTeam(owner_id: string, name: string): Promise<Team> {
  if (!name.trim()) throw new Error('Team name cannot be empty');
  // Checks if owner exists and has leader role
  const owner = await userRepository.getUserById(owner_id);
  if (!owner) throw new Error('User not found');
  if (owner.role !== 'leader') throw new Error('Only leaders can create teams');
  // Creates team
  const team: Team = {
    team_id: ulid(),
    owner_id,
    name,
    created_at: new Date().toISOString(),
  };
  const newTeam = await teamRepository.insertTeam(team);
  // Inserts the owner as the first member of the team
  await teamRepository.insertUserToTeam({
    team_members_id: ulid(),
    team_id: newTeam.team_id,
    user_id: owner_id,
    role: 'leader',
    invited_at: new Date().toISOString(),
    joined_at: new Date().toISOString(),
  });
  return newTeam;
}

// Get all groups a user belongs to 
export async function getUserTeams(user_id: string): Promise<Team[]> {
  return await teamRepository.getTeamsByUserId(user_id);
}

// Update team name
export async function updateTeamName(team_id: string, name: string, user_id: string): Promise<Team> {
  if (!name.trim()) throw new Error('Team name cannot be empty');
  const teams = await teamRepository.getTeamDetails(user_id);
  const team = teams.find(t => t.team_id === team_id);
  if (!team) throw new Error('Team not found or user has no access');
  if (team.owner_id !== user_id) throw new Error('User is not the owner of the team');
  return await teamRepository.updateTeamName(name, team_id);
}

// Add user to team
export async function addUserToTeam(
  team_id: string,
  userToAddId: string,
  requestingUserId: string,
  role: UserRole = 'user'
): Promise<TeamMember | null> {
  if (!['leader', 'user'].includes(role)) throw new Error('Invalid role');
  // Team details
  const [ownerTeam] = await teamRepository.getTeamDetails(team_id);
  if (!ownerTeam) throw new Error('Team not found');
  // Only team leaders can add members
  if (ownerTeam.owner_id !== requestingUserId) throw new Error('Only the owner can add members');
  // Users exists
  const userToAdd = await userRepository.getUserById(userToAddId);
  if (!userToAdd) throw new Error('User to add not found');
  // User is not a member of the team
  const teamMembers = await teamRepository.listTeamMembers(team_id);
  if (teamMembers.find(m => m.user_id === userToAddId)) throw new Error('User is already in the team');
  const invite: Invite = {
    team_members_id: ulid(),
    team_id,
    user_id: userToAddId,
    role,
    invited_at: new Date().toISOString(),
    joined_at: new Date().toISOString(),
  };
  return await teamRepository.insertUserToTeam(invite);
}

// Delete user from team
export async function removeUserFromTeam(team_id: string, user_id: string, performed_by: string): Promise<boolean> {
  const team = await teamRepository.getTeamDetails(performed_by);
  const t = team.find(t => t.team_id === team_id);
  if (!t) throw new Error('Team not found or user has no access');
  // Only owner can remove members
  if (t.owner_id !== performed_by) throw new Error('Only the owner can remove members');
  return await teamRepository.deleteUserFromTeam(user_id, team_id);
}

// Lists users from team
export async function getTeamMembers(team_id: string, user_id: string): Promise<TeamMember[]> {
  // Checks if the user is member of the team
  const teamDetails = await teamRepository.getTeamDetails(user_id);
  const teamMembers = await teamRepository.listTeamMembers(team_id);
  const isOwner = teamDetails.some(t => t.team_id === team_id && t.owner_id === user_id);
  const isMember = teamMembers.some(m => m.user_id === user_id);
  if (!isOwner && !isMember) {
    return []; // User has no access
  }
  return teamMembers;
}

// Lists tasks of teams
export async function getTeamTasks(team_id: string, user_id: string): Promise<TeamTask[]> {
  // Checks if the user is a member of the team
  const teamMembers = await teamRepository.listTeamMembers(team_id);
  const teamDetails = await teamRepository.getTeamDetails(user_id); // user's teams
  const isMember = teamMembers.some(m => m.user_id === user_id);
  const isOwner = teamDetails.some(t => t.team_id === team_id && t.owner_id === user_id);
  if (!isMember && !isOwner) {
    // User has no access -> returns empty array
    return [];
  }
  // User has access -> returns tasks array
  return await teamRepository.listTeamTasks(team_id);
}

// Delete team
export async function deleteTeam(team_id: string, user_id: string): Promise<boolean> {
  const teamDetails = await teamRepository.getTeamDetails(user_id);
  const team = teamDetails.find(t => t.team_id === team_id);
  if (!team) throw new Error("Team not found or user has no access");
  if (team.owner_id !== user_id) throw new Error("Only the owner can delete the team");
  return await teamRepository.deleteTeam(team_id);
}

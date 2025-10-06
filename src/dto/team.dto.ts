export interface GetUserTeamsParams extends Record<string, string> {
  user_id: string;
}

export interface UpdateTeamParams extends Record<string, string> {
  team_id: string;
}

export interface AddUserToTeamParams extends Record<string, string> {
  team_id: string;
}

export interface RemoveUserFromTeamParams extends Record<string, string> {
  team_id: string;
  user_id: string;
}

export interface ListTeamMembersParams extends Record<string, string> {
  team_id: string;
}

export interface DeleteTeamParams extends Record<string, string> {
  team_id: string;
}

export interface UpdateTeamBody { name: string }
export interface AddUserToTeamBody { user_id: string }
export interface CreateTeamBody { owner_id: string; name: string; }

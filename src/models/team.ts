import { UserRole } from '../models/user';

export type Team = {
  team_id: string;
  owner_id: string;
  name: string;
  created_at: string;
}

export type Invite = {
  team_members_id: string;
  team_id: string;
  user_id: string;
  role: UserRole;
  invited_at: string;
  joined_at: string;
}

export interface TeamMember {
  team_members_id: string;
  team_id: string;
  user_id: string;
  role: UserRole;
  invited_at: Date | null;
  joined_at: Date | null;
}

export type TeamFilter = {
  id?: string;
  owner_id?: string;
  name?: string;
}

import { UserRole } from '../models/user';
import { TaskPriority, TaskStatus } from './task';


export type Team = {
  team_id: string;
  owner_id: string;
  name: string;
  created_at: string; // JSON will use ISOStrings (.toISOString())
}

export interface TeamRow {
  team_id: string;
  name: string;
  owner_id: string;
  created_at: Date;
  member_user_id: string;
  member_role: UserRole;
  member_invited_at: Date | null;
  member_joined_at: Date | null;
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


export interface TeamTask {
  task_id: string;
  team_id: string;
  assigned_to: string | null;
  created_by: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  deadline: Date;
  content: string | null;
  last_modified_at: Date;
}

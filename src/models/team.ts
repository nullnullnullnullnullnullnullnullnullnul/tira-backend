import { BaseModel } from './base';
import { UserRole } from '../models/user';

export interface Team extends BaseModel {
  team_id: string;
  owner_id: string;
  name: string;
  created_at: string;
}

interface TeamMembershipBase<TTimestamp> extends BaseModel {
  team_members_id: string;
  team_id: string;
  user_id: string;
  role: UserRole;
  invited_at: TTimestamp;
  joined_at: TTimestamp;
}

export type Invite = TeamMembershipBase<string>;

export type TeamMember = TeamMembershipBase<Date | null>;

export type TeamFilter = Partial<Pick<Team, 'team_id' | 'owner_id' | 'name'>>;

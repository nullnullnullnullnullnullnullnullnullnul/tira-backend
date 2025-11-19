import { PathParams } from "./base.dto";
import { PaginationQuery } from "./pagination.dto";

export type GetUserTeamsParams = PathParams<"user_id">;
export type UpdateTeamParams = PathParams<"team_id">;
export type AddUserToTeamParams = PathParams<"team_id">;
export type RemoveUserFromTeamParams = PathParams<"team_id" | "user_id">;
export type ListTeamMembersParams = PathParams<"team_id">;
export type DeleteTeamParams = PathParams<"team_id">;
export type UpdateTeamBody = Pick<CreateTeamBody, "name">;

export interface AddUserToTeamBody {
  user_id: string
}

export type CreateTeamBody = {
  owner_id: string;
  name: string;
}

export type GetUserTeamsQuery = PaginationQuery;
export type ListTeamMembersQuery = PaginationQuery;

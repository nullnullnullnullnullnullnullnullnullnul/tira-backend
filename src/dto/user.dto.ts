import { UserRole } from '../models/user';

export interface ListUsersQuery {
  username?: string;
  email?: string;
  role?: UserRole;
  user_id?: string;
  offset?: number;
  limit?: number;
}

export interface CreateUserBody {
  username: string;
  email: string;
  role: UserRole;
  password: string;
}

export interface UpdateUserBody {
  username?: string;
  email?: string;
  password?: string;
}

export interface DeleteUserParams extends Record<string, string> {
  user_id: string;
}

export interface UpdateUserParams extends Record<string, string> {
  user_id: string;
}

import { UserRole } from '../models/user';
import { PaginationQuery } from './pagination.dto';

export interface ListUsersQuery extends PaginationQuery {
  username?: string;
  email?: string;
  role?: UserRole;
  user_id?: string;
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

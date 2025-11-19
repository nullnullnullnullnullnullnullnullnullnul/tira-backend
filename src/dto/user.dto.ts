import { UserRole } from '../models/user';
import { PaginatedQuery, PathParams } from './base.dto';

export type ListUsersQuery = PaginatedQuery<{
  username?: string;
  email?: string;
  role?: UserRole;
  user_id?: string;
}>;

export interface CreateUserBody {
  username: string;
  email: string;
  role: UserRole;
  password: string;
}

export type UpdateUserBody = Partial<Pick<CreateUserBody, 'username' | 'email' | 'password'>>;
export type DeleteUserParams = PathParams<'user_id'>;
export type UpdateUserParams = PathParams<'user_id'>;

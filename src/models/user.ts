export type User = {
  user_id: string;
  username: string;
  email: string;
  role: UserRole;
  created_at: string; // JSON will use ISOStrings (.toISOString())
  last_login: string | null; // Ej: "2025-09-07T18:00:00"
  pwd_hash: string
}
export type UserRole = "leader" | "user";
export const validRoles: UserRole[] = ["leader", "user"];
export type UserFilter = {
  user_id?: string;
  username?: string;
  email?: string;
  role?: string;
}

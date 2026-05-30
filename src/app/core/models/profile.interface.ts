export type UserRole = 'user' | 'admin';

export interface Profile {
  id: string; // UUID referencing auth.users.id
  username: string; // unique handle chosen by user or auto-provisioned
  avatar_url: string; // URL to avatar image
  role: UserRole; // 'user' or 'admin'
  created_at: string; // ISO date string
}

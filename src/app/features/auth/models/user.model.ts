export type UserType = 'ADMIN' | 'STUDENT' | 'RESEARCHER' | 'PROFESSOR';

export interface User {
  id: string; // UUID
  name: string;
  email: string;
  user_type: UserType;
  profile_picture_url?: string | null;
}

export interface UserRegistration {
  name: string;
  email: string;
  password: string;
  user_type: UserType;
  profile_picture_url?: string | null;
}

export type UserType = 'ADMIN' | 'STUDENT' | 'RESEARCHER' | 'PROFESSOR';
export type AuthProvider = 'GOOGLE' | 'LOCAL' | 'BOTH';

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
  auth_provider: AuthProvider;
}

export interface ResetPasswordPayload {
  token: string;
  new_password: string;
}

export interface GoogleRegisterRequest {
  email: string;
  name: string;
  user_type: UserType;
}

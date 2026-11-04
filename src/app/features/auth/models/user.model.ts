export type UserType = 'ADMIN' | 'STUDENT' | 'RESEARCHER' | 'PROFESSOR';
export type AuthProvider = 'GOOGLE' | 'LOCAL' | 'BOTH';

export const USER_TYPE_OPTIONS: { value: UserType; label: string }[] = [
  { value: 'STUDENT', label: 'Estudante' },
  { value: 'RESEARCHER', label: 'Pesquisador' },
  { value: 'PROFESSOR', label: 'Professor' },
];

export const USER_TYPE_LABELS: Record<UserType, string> = {
  STUDENT: 'Estudante',
  RESEARCHER: 'Pesquisador',
  PROFESSOR: 'Professor',
  ADMIN: 'Administrador',
};

export const AUTH_PROVIDER_LABELS: Record<AuthProvider, string> = {
  LOCAL: 'E-mail e senha',
  GOOGLE: 'Conta Google',
  BOTH: 'Google e Senha',
};

export interface User {
  id: string; // UUID
  name: string;
  email: string;
  user_type: UserType;
  institution?: string | null;
  profile_picture_url?: string | null;
  auth_provider?: AuthProvider;
  created_at?: string;
}

export interface UserRegistration {
  name: string;
  email: string;
  password: string;
  user_type: UserType;
  institution?: string | null;
  profile_picture_url?: string | null;
  auth_provider: AuthProvider;
}

export interface UserUpdate {
  name?: string;
  user_type?: UserType;
  institution?: string | null;
}

export interface ResetPasswordPayload {
  token: string;
  new_password: string;
}

export interface GoogleRegisterRequest {
  email: string;
  name: string;
  user_type: UserType;
  institution?: string | null;
}

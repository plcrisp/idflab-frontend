export interface User {
  id: string; // UUID
  name: string;
  email: string;
  user_type: string;
  profile_picture_url?: string | null;
}

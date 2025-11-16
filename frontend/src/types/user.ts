export interface User {
  id: string;
  email: string;
  is_active: boolean;
  is_superuser: boolean;
  is_verified: boolean;
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  created_at: string;
  updated_at: string;
}

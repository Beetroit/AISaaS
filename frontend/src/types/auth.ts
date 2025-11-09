export interface Token {
  access_token: string;
  token_type: string;
}

export interface UserResponse {
  id: string;
  email: string;
  is_active: boolean;
  agent_ids: string[];
}

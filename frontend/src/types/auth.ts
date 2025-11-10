export interface Token {
  access_token: string;
  token_type: string;
}

export interface UserResponse {
  id: string;
  email: string;
  is_active: boolean;
  message_credits: number
  agent_ids: string[];
}

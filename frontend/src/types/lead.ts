export interface LeadBase {
  email?: string | null;
  phone_number?: string | null;
  name?: string | null;
  source?: string | null;
  qualification_status?: string;
  contact_info?: string | null;
}

export interface LeadCreate extends LeadBase {
  _?: never
}

export interface LeadUpdate {
  email?: string | null;
  phone_number?: string | null;
  name?: string | null;
  source?: string | null;
  qualification_status?: string | null;
  contact_info?: string | null;
}

export interface LeadRead extends LeadBase {
  id: string;
  user_id: string;
  agent_id: string;
  chat_session_id: string;
  created_at: string
  updated_at: string
}

export interface LeadMappingConfig {
  field_map: { [key: string]: string };
  default_values: { [key: string]: string }; // Assuming default values are strings for input
}

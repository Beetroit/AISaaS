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
  qualification_status?: string | null;
  source?: string | null;
  contact_info?: Record<string, unknown> | null;
  notes?: string | null;
}

export interface LeadRead {
  id: string;
  user_id: string;
  agent_id: string;
  chat_session_id: string;
  qualification_status: string;
  source?: string | null;
  contact_info?: Record<string, unknown> | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface LeadMappingConfig {
  field_map: { [key: string]: string };
  default_values: { [key: string]: string }
}

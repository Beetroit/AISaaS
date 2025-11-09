export interface LeadBase {
  email?: string | null;
  phone_number?: string | null;
  name?: string | null;
  source?: string | null;
  qualification_status?: string;
  contact_info?: Record<string, any> | null;
}

export interface LeadCreate extends LeadBase {}

export interface LeadUpdate {
  email?: string | null;
  phone_number?: string | null;
  name?: string | null;
  source?: string | null;
  qualification_status?: string | null;
  contact_info?: Record<string, any> | null;
}

export interface LeadRead extends LeadBase {
  id: string;
  user_id: string;
  agent_id: string;
  chat_session_id: string;
  created_at: string; // datetime serialized as ISO string
  updated_at: string; // datetime serialized as ISO string
}

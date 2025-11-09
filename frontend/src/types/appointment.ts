export interface AppointmentBase {
  appointment_time: string; // datetime serialized as ISO string
  status?: string;
  notes?: string;
}

export interface AppointmentCreate extends AppointmentBase {
  user_id: string;
  agent_id: string;
  lead_id: string;
}

export interface AppointmentUpdate {
  appointment_time?: string; // datetime serialized as ISO string
  status?: string;
  notes?: string;
}

export interface AppointmentRead extends AppointmentBase {
  id: string;
  user_id: string;
  agent_id: string;
  lead_id: string;
  created_at: string; // datetime serialized as ISO string
  updated_at: string; // datetime serialized as ISO string
}

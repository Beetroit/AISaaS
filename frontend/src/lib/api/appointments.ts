import { callApi } from "./core";
import { AppointmentCreate, AppointmentRead, AppointmentUpdate } from "../../types/appointment";

export async function createAppointment(appointment: AppointmentCreate): Promise<AppointmentRead> {
  return callApi<AppointmentRead>("/appointments/", {
    method: "POST",
    body: appointment,
  });
}

export async function getAppointment(appointmentId: string): Promise<AppointmentRead> {
  return callApi<AppointmentRead>(`/appointments/${appointmentId}`);
}

export async function getAppointments(skip: number = 0, limit: number = 100): Promise<AppointmentRead[]> {
  return callApi<AppointmentRead[]>(`/appointments/?skip=${skip}&limit=${limit}`);
}

export async function updateAppointment(
  appointmentId: string,
  appointment: AppointmentUpdate
): Promise<AppointmentRead> {
  return callApi<AppointmentRead>(`/appointments/${appointmentId}`, {
    method: "PUT",
    body: appointment,
  });
}

export async function deleteAppointment(appointmentId: string): Promise<void> {
  return callApi<void>(`/appointments/${appointmentId}`, {
    method: "DELETE",
  });
}

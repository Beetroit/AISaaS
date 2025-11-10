import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    createAppointment,
    deleteAppointment,
    getAppointment,
    getAppointments,
    updateAppointment,
} from "../lib/api/appointments";
import { AppointmentCreate, AppointmentRead, AppointmentUpdate } from "../types/appointment";

// --- Queries ---

export function useAppointments(skip: number = 0, limit: number = 100) {
  return useQuery<AppointmentRead[], Error>({
    queryKey: ["appointments", { skip, limit }],
    queryFn: () => getAppointments(skip, limit),
  });
}

export function useAppointment(appointmentId: string) {
  return useQuery<AppointmentRead, Error>({
    queryKey: ["appointment", appointmentId],
    queryFn: () => getAppointment(appointmentId),
    enabled: !!appointmentId, // Only run query if appointmentId is available
  });
}

// --- Mutations ---

export function useCreateAppointment() {
  const queryClient = useQueryClient();
  return useMutation<AppointmentRead, Error, AppointmentCreate>({
    mutationFn: (appointment: AppointmentCreate) => createAppointment(appointment),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] })
    },
  });
}

export function useUpdateAppointment() {
  const queryClient = useQueryClient();
  return useMutation<
    AppointmentRead,
    Error,
    { appointmentId: string; appointment: AppointmentUpdate }
  >({
    mutationFn: ({ appointmentId, appointment }) =>
      updateAppointment(appointmentId, appointment),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] })
      queryClient.invalidateQueries({ queryKey: ["appointment", data.id] })
    },
  });
}

export function useDeleteAppointment() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: (appointmentId: string) => deleteAppointment(appointmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] })
    },
  });
}

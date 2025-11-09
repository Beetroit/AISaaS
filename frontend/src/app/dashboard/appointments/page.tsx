"use client";

import React from 'react';
import { useAppointments, useDeleteAppointment } from '../../../hooks/useAppointments'; // Adjust path as needed

export default function AppointmentsPage() {
  const { data: appointments, isLoading, isError, error } = useAppointments();
  const deleteAppointmentMutation = useDeleteAppointment();

  const handleDeleteAppointment = (appointmentId: string) => {
    if (confirm("Are you sure you want to delete this appointment?")) {
      deleteAppointmentMutation.mutate(appointmentId, {
        onSuccess: () => {
          console.log(`Appointment ${appointmentId} deleted successfully.`);
          // Invalidate appointments query to refetch the list
        },
        onError: (err) => {
          console.error(`Failed to delete appointment ${appointmentId}:`, err.message);
          // TODO: Display user-friendly error message
        },
      });
    }
  };

  if (isLoading) {
    return (
      <div>
        <h2 className="text-2xl font-semibold mb-4">Appointments Management</h2>
        <p>Loading appointments...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div>
        <h2 className="text-2xl font-semibold mb-4">Appointments Management</h2>
        <p className="text-red-500">Error loading appointments: {error?.message}</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Appointments Management</h2>

      {appointments && appointments.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white dark:bg-gray-800 rounded-lg shadow">
            <thead>
              <tr className="w-full bg-gray-200 dark:bg-gray-700 text-left text-gray-600 dark:text-gray-300 uppercase text-sm">
                <th className="py-3 px-4">Time</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Agent ID</th>
                <th className="py-3 px-4">Lead ID</th>
                <th className="py-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {appointments.map((appointment) => (
                <tr key={appointment.id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700">
                  <td className="py-3 px-4">{new Date(appointment.appointment_time).toLocaleString()}</td>
                  <td className="py-3 px-4">{appointment.status}</td>
                  <td className="py-3 px-4">{appointment.agent_id}</td>
                  <td className="py-3 px-4">{appointment.lead_id}</td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => handleDeleteAppointment(appointment.id)}
                      className="bg-red-500 text-white px-3 py-1 rounded-md text-sm hover:bg-red-600"
                      disabled={deleteAppointmentMutation.isPending}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p>No appointments found.</p>
      )}
    </div>
  );
}

import { simulateNetworkCall } from '../lib/apiClient';
import { mockDb } from './mockDb';
import { type GlobalAppointment } from "../types";

export const appointmentService = {
  // En el futuro:
  // getUpcomingAppointments: (date) => apiClient.get('/appointments/upcoming', { params: { date } })
  // getAppointmentsByDate: (date, doctorName) => apiClient.get('/appointments', { params: { date, doctorName } })
  // createAppointment: (data) => apiClient.post('/appointments', data)
  // updateAppointment: (id, data) => apiClient.patch(`/appointments/${id}`, data)

  getUpcomingAppointments: async (doctorId?: string, date?: string) => {
    const proximas = mockDb.appointments.filter(a => a.status !== "cancelada").slice(0, 3);
    return simulateNetworkCall(proximas, 1000, "Timeout al solicitar agenda del servidor.");
  },

  getAppointmentsByDate: async (date: string, doctorName: string) => {
    let filtered = mockDb.appointments.filter(a => a.date === date);
    if (doctorName !== "Todos") {
      filtered = filtered.filter(a => a.doctorId === "doc-1"); 
    }
    return simulateNetworkCall(filtered, 700, "Conexión perdida con el servidor de agenda.");
  },

  createAppointment: async (data: Omit<GlobalAppointment, "id">) => {
    const newAppt = { ...data, id: `app-${Date.now()}` } as GlobalAppointment;
    const savedAppt = await simulateNetworkCall(newAppt, 1000, "Fallo al registrar la cita.");
    mockDb.appointments = [...mockDb.appointments, savedAppt];
    return savedAppt;
  },

  updateAppointment: async (id: string, updates: Partial<GlobalAppointment>) => {
    const updatedAppt = await simulateNetworkCall({ id, ...updates }, 600, "No se pudo actualizar el estado de la cita.");
    mockDb.appointments = mockDb.appointments.map(a => a.id === id ? { ...a, ...updates, id } as GlobalAppointment : a);
    return updatedAppt;
  }
};

import { apiClient } from '../lib/apiClient';
import { type GlobalAppointment } from "../types";
import { apiAppointmentToUi, uiAppointmentToApi } from './adapters';

type ApiAppointment = {
  id: string;
  pacienteId: string;
  medicoId: string;
  fechaHora: string;
  duracion?: number | null;
  tipo?: string | null;
  estado?: 'confirmada' | 'pendiente' | 'cancelada' | 'completada' | null;
  notas?: string | null;
};

function isoDayBounds(date: Date) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  return { since: start.toISOString(), until: end.toISOString() };
}

function doctorIdFromSession() {
  try {
    const raw = localStorage.getItem('auth_user');
    if (!raw) return undefined;
    const user = JSON.parse(raw);
    return user?.id;
  } catch {
    return undefined;
  }
}

export const appointmentService = {
  getUpcomingAppointments: async (doctorId?: string, date?: string) => {
    const targetDate = date ? new Date(date) : new Date();
    const { since, until } = isoDayBounds(targetDate);
    const medicoId = doctorId || doctorIdFromSession();
    const query = new URLSearchParams({ since, until });
    if (medicoId) query.set('medicoId', medicoId);

    const appointments = await apiClient.get<ApiAppointment[]>(`/appointments?${query.toString()}`);
    return appointments
      .map((a) => apiAppointmentToUi(a))
      .filter((a) => a.status !== 'cancelada')
      .sort((a, b) => {
        // Confirmada = En Sala de Espera / Listo para doctor
        if (a.status === 'confirmada' && b.status !== 'confirmada') return -1;
        if (b.status === 'confirmada' && a.status !== 'confirmada') return 1;
        // Pendiente = Agendado pero no ha llegado
        if (a.status === 'pendiente' && b.status !== 'pendiente') return -1;
        if (b.status === 'pendiente' && a.status !== 'pendiente') return 1;
        // Ordenar por hora si tienen el mismo estado
        return a.time.localeCompare(b.time);
      })
      .slice(0, 10);
  },

  getAppointmentsByDate: async (date: string) => {
    const targetDate = new Date(`${date}T00:00:00`);
    const { since, until } = isoDayBounds(targetDate);
    const params = new URLSearchParams({ since, until });

    const appointments = await apiClient.get<ApiAppointment[]>(`/appointments?${params.toString()}`);
    return appointments.map((a) => apiAppointmentToUi(a));
  },

  createAppointment: async (data: Omit<GlobalAppointment, "id">) => {
    const payload = uiAppointmentToApi(data);
    const created = await apiClient.post<ApiAppointment>('/appointments', payload);
    return apiAppointmentToUi(created);
  },

  updateAppointment: async (id: string, updates: Partial<GlobalAppointment>) => {
    const payload: Record<string, any> = {};
    if (updates.date || updates.time || updates.patientId || updates.doctorId) {
      payload.fechaHora = uiAppointmentToApi({
        id: id,
        patientId: updates.patientId || '',
        doctorId: updates.doctorId || doctorIdFromSession() || '',
        date: updates.date || new Date().toISOString().split('T')[0],
        time: updates.time || '09:00 AM',
        patientName: '',
        type: updates.type || 'rutina',
        status: updates.status || 'pendiente',
        notes: updates.notes
      } as GlobalAppointment).fechaHora;
    }
    if (updates.type !== undefined) payload.tipo = updates.type;
    if (updates.status !== undefined) payload.estado = updates.status;
    if (updates.notes !== undefined) payload.notas = updates.notes;

    const updated = await apiClient.put<ApiAppointment>(`/appointments/${id}`, payload);
    return apiAppointmentToUi(updated);
  }
};

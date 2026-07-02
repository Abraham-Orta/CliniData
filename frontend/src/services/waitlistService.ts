import { apiClient } from '../lib/apiClient';

type WaitlistItem = {
  id: string;
  pacienteId: string;
  urgencia: string;
  tipoRequerido?: string;
  notas?: string;
  estado: string;
  creadoEn: string;
  paciente?: {
    id: string;
    nombre: string;
    apellido: string;
  };
};

type UiWaitlistItem = {
  id: string;
  patientId: string;
  patientName: string;
  urgency: string;
  requiredType: string;
  addedAt: string;
};

function apiToUi(item: WaitlistItem): UiWaitlistItem {
  const patientName = item.paciente
    ? `${item.paciente.nombre || ''} ${item.paciente.apellido || ''}`.trim()
    : 'Paciente';
  
  const date = new Date(item.creadoEn);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  let addedAt = 'Justo ahora';
  if (diffHours >= 24) addedAt = `Hace ${Math.floor(diffHours / 24)} día(s)`;
  else if (diffHours >= 1) addedAt = `Hace ${diffHours}h`;
  else {
    const diffMin = Math.floor(diffMs / (1000 * 60));
    if (diffMin >= 1) addedAt = `Hace ${diffMin}min`;
  }

  return {
    id: item.id,
    patientId: item.pacienteId,
    patientName,
    urgency: item.urgencia,
    requiredType: item.tipoRequerido || 'rutina',
    addedAt
  };
}

export const waitlistService = {
  getWaitlist: async (): Promise<UiWaitlistItem[]> => {
    try {
      const items = await apiClient.get<WaitlistItem[]>('/waitlist');
      return (items || []).map(apiToUi);
    } catch (e) {
      console.error('Error fetching waitlist:', e);
      return [];
    }
  },

  addToWaitlist: async (data: {
    pacienteId: string;
    urgencia?: string;
    tipoRequerido?: string;
    notas?: string;
  }): Promise<UiWaitlistItem | null> => {
    try {
      const created = await apiClient.post<WaitlistItem>('/waitlist', data);
      return apiToUi(created);
    } catch (e) {
      console.error('Error adding to waitlist:', e);
      return null;
    }
  },

  removeFromWaitlist: async (id: string): Promise<boolean> => {
    try {
      await apiClient.delete(`/waitlist/${id}`);
      return true;
    } catch (e) {
      console.error('Error removing from waitlist:', e);
      return false;
    }
  }
};

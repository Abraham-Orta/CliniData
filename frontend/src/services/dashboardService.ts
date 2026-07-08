import { apiClient } from '../lib/apiClient';

export const dashboardService = {
  getKPIs: async () => {
    const dashboard = await apiClient.get<any>('/dashboard');
    return dashboard?.data || {};
  },

  getSystemEvents: async (page: number, limit: number) => {
    let role = 'medico';
    try {
      const rawUser = localStorage.getItem('auth_user');
      if (rawUser) {
        const userObj = JSON.parse(rawUser);
        role = (userObj.role || userObj.rol || 'medico').toLowerCase();
      }
    } catch(e) {}

    if (role === 'admin') {
      try {
        const auditorias: any = await apiClient.get('/auditorias');
        const audData = Array.isArray(auditorias) ? auditorias : (auditorias?.data || []);
        const validEvents = audData.map((a: any) => ({
          id: a.id,
          type: 'system',
          doctorName: (a.usuario?.nombre || a.usuario?.email) || 'Sistema',
          action: a.accion || 'Evento',
          patientName: a.detalles || '',
          timeAgo: 'Reciente',
          read: false
        }));
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        return { events: validEvents.slice(startIndex, endIndex), hasMore: endIndex < validEvents.length };
      } catch (err) {
        console.warn("Fallo al cargar auditorias, usando eventos sintéticos");
      }
    }

    // Para médicos (o si falla el admin), usamos eventos sintéticos del dashboard
    try {
      const dashboard = await apiClient.get<any>('/dashboard');
      const syntheticEvents = (dashboard?.data?.diagnosticosFrecuentes || []).map((d: any, i: number) => ({
        id: `synthetic-${i}`,
        type: 'update',
        doctorName: 'Sistema',
        action: 'actualizó tendencia de',
        patientName: d.descripcion || 'diagnóstico',
        timeAgo: 'Hace un momento',
        read: false
      }));
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      return { events: syntheticEvents.slice(startIndex, endIndex), hasMore: endIndex < syntheticEvents.length };
    } catch (error) {
      return { events: [], hasMore: false };
    }
  }
};

import { apiClient } from '../lib/apiClient';

export const dashboardService = {
  getKPIs: async () => {
    const today = new Date();
    const dayStart = new Date(today);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(today);
    dayEnd.setHours(23, 59, 59, 999);

    const [dashboard, appointments, patients] = await Promise.all([
      apiClient.get<any>('/dashboard'),
      apiClient.get<any[]>(`/appointments?since=${dayStart.toISOString()}&until=${dayEnd.toISOString()}`),
      apiClient.get<any>('/patients?page=1&limit=200')
    ]);

    const pacientesAtendidosHoy = (appointments || []).filter((a) => a.estado === 'completada').length;
    const totalPacientes = Array.isArray(patients?.data) ? patients.data.length : 0;

    const alertas =
      dashboard?.data?.diagnosticosFrecuentes?.slice(0, 2).map((d: any, i: number) => ({
        id: `diag-${i}`,
        severity: i === 0 ? 'high' : 'medium',
        date: 'Actualizado en vivo',
        title: `Diagnóstico frecuente: ${d.codigo || 'N/A'}`,
        description: `${d.descripcion || 'Sin descripción'} (${d.cantidad || 0} casos recientes).`
      })) || [];

    return {
      pacientesAtendidosHoy,
      casosCriticos: 0,
      interconsultas: 0,
      reportsCount: totalPacientes,
      alertasEpidemiologicas: alertas
    };
  },

  getSystemEvents: async (page: number, limit: number) => {
    try {
      const auditorias = await apiClient.get<any[]>('/auditorias');
      const validEvents = (auditorias || []).map((a: any) => ({
        id: a.id,
        type: 'system',
        doctorName: a.usuario || 'Sistema',
        action: a.accion || 'Evento',
        patientName: a.detalles || '',
        timeAgo: 'Reciente',
        read: false
      }));
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      return { events: validEvents.slice(startIndex, endIndex), hasMore: endIndex < validEvents.length };
    } catch {
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
    }
  }
};

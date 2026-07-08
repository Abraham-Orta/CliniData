import { apiClient } from '../lib/apiClient';

function monthLabel(date: Date) {
  const m = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  return m[date.getMonth()];
}

export const reportsService = {
  getGlobalStats: async () => {
    const [patientsResponse, appointments] = await Promise.all([
      apiClient.get<any>('/patients?page=1&limit=500'),
      apiClient.get<any[]>('/appointments')
    ]);

    const totalPatients = patientsResponse?.meta?.total ?? (patientsResponse?.data?.length || 0);
    const criticalPatients = 0;
    const completedAppointments = (appointments || []).filter((a) => a.estado === 'completada').length;
    const totalAppointments = (appointments || []).length;
    const completionRate = totalAppointments > 0 ? Math.round((completedAppointments / totalAppointments) * 100) : 0;

    return {
      totalPatients,
      criticalPatients,
      completedAppointments,
      completionRate
    };
  },

  getDemographics: async () => {
    // Intentar obtener datos reales del dashboard (solo disponible para MEDICO)
    try {
      const dashboard = await apiClient.get<any>('/dashboard');
      if (dashboard?.data?.demografiaGenero) {
        const genderData = dashboard.data.demografiaGenero.map((g: any) => ({
          name: g.name === 'MASCULINO' ? 'Masculino' : g.name === 'FEMENINO' ? 'Femenino' : 'Otro',
          value: g.value || 0,
          color: g.name === 'MASCULINO' ? '#0B5394' : g.name === 'FEMENINO' ? '#BE185D' : '#7C3AED'
        }));
        return { statusDistribution: genderData };
      }
    } catch (e) {
      console.warn('Fallback to patient count due to dashboard error:', e);
    }

    // Fallback: distribución genérica
    const response = await apiClient.get<any>('/patients?page=1&limit=500');
    const patients = response?.data || [];
    return {
      statusDistribution: [
        { name: 'Total Pacientes', value: patients.length, color: '#047857' },
        { name: 'Observación', value: 0, color: '#F59E0B' },
        { name: 'Crítico', value: 0, color: '#DC2626' }
      ]
    };
  },

  getAdvancedMetrics: async () => {
    const appointments = await apiClient.get<any[]>('/appointments');
    const total = (appointments || []).length;
    const completed = (appointments || []).filter((a) => a.estado === 'completada').length;
    const canceladas = (appointments || []).filter((a) => a.estado === 'cancelada').length;

    const noShowRate = total > 0 ? Number(((canceladas / total) * 100).toFixed(1)) : 0;
    const completadasRate = total > 0 ? Number(((completed / total) * 100).toFixed(1)) : 0;

    return {
      averageWaitTime: 24, // En minutos (estimado)
      noShowRate: noShowRate,
      completedRate: completadasRate
    };
  },

  getTopConditions: async () => {
    const dashboard = await apiClient.get<any>('/dashboard');
    const top = dashboard?.data?.diagnosticosFrecuentes || [];
    return top.map((d: any) => ({
      name: d.descripcion || d.codigo || 'Sin dato',
      count: d.cantidad || 0
    }));
  },

  getAppointmentsTrends: async () => {
    const appointments = await apiClient.get<any[]>('/appointments');
    const buckets = new Map<string, { consultas: number; ingresos: number }>();

    for (let i = 0; i < 6; i++) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      buckets.set(`${d.getFullYear()}-${d.getMonth()}`, { consultas: 0, ingresos: 0 });
    }

    (appointments || []).forEach((a) => {
      const d = new Date(a.fechaHora);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      if (!buckets.has(key)) return;
      const current = buckets.get(key)!;
      current.consultas += 1;
      if (a.estado === 'completada') current.ingresos += 1;
      buckets.set(key, current);
    });

    const trends = Array.from(buckets.entries())
      .map(([key, value]) => {
        const [y, m] = key.split('-').map(Number);
        const date = new Date(y, m, 1);
        return { name: monthLabel(date), consultas: value.consultas, atendidos: value.ingresos, sort: date.getTime() };
      })
      .sort((a, b) => a.sort - b.sort)
      .map(({ sort, ...rest }) => rest);

    return trends;
  }
};

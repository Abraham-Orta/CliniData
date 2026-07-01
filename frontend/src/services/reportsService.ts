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
    const response = await apiClient.get<any>('/patients?page=1&limit=500');
    const patients = response?.data || [];
    const statusCounts = {
      estable: patients.length,
      observacion: 0,
      critico: 0
    } as Record<string, number>;

    // Formatear para recharts
    const statusData = [
      { name: 'Estable', value: statusCounts['estable'] || 0, color: '#047857' },
      { name: 'Observación', value: statusCounts['observacion'] || 0, color: '#F59E0B' },
      { name: 'Crítico', value: statusCounts['critico'] || 0, color: '#DC2626' }
    ];

    return {
      statusDistribution: statusData
    };
  },

  getAdvancedMetrics: async () => {
    const appointments = await apiClient.get<any[]>('/appointments');
    const total = (appointments || []).length;
    const completed = (appointments || []).filter((a) => a.estado === 'completada').length;

    return {
      bedOccupancy: 0,
      averageWaitTime: 24,
      readmissionRate: 0,
      resolutivityRate: total > 0 ? Number(((completed / total) * 100).toFixed(1)) : 0,
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
        return { name: monthLabel(date), consultas: value.consultas, ingresos: value.ingresos, sort: date.getTime() };
      })
      .sort((a, b) => a.sort - b.sort)
      .map(({ sort, ...rest }) => rest);

    return trends;
  }
};

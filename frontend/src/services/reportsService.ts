import { simulateNetworkCall } from '../lib/apiClient';
import { mockDb } from './mockDb';

export const reportsService = {
  getGlobalStats: async () => {
    const totalPatients = mockDb.patients.length;
    const criticalPatients = mockDb.patients.filter(p => p.status === 'critico').length;
    const completedAppointments = mockDb.appointments.filter(a => a.status === 'completada').length;
    const totalAppointments = mockDb.appointments.length;
    const completionRate = totalAppointments > 0 ? Math.round((completedAppointments / totalAppointments) * 100) : 0;

    return simulateNetworkCall({
      totalPatients,
      criticalPatients,
      completedAppointments,
      completionRate
    }, 1000, "Error loading global stats.");
  },

  getDemographics: async () => {
    const statusCounts = mockDb.patients.reduce((acc, p) => {
      const status = p.status || 'estable';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Formatear para recharts
    const statusData = [
      { name: 'Estable', value: statusCounts['estable'] || 0, color: '#047857' },
      { name: 'Observación', value: statusCounts['observacion'] || 0, color: '#F59E0B' },
      { name: 'Crítico', value: statusCounts['critico'] || 0, color: '#DC2626' }
    ];

    return simulateNetworkCall({
      statusDistribution: statusData
    }, 1200, "Error loading demographics.");
  },

  getAdvancedMetrics: async () => {
    // Bed Occupancy
    const admittedPatients = mockDb.patients.filter(p => p.status === 'observacion' || p.status === 'critico').length;
    const bedOccupancy = Math.round((admittedPatients / mockDb.config.totalBeds) * 100);

    // Readmission & Resolutivity Rate from Visits
    const totalVisits = mockDb.visits.length;
    const readmissions = mockDb.visits.filter(v => v.isReadmission).length;
    const resolvedVisits = mockDb.visits.filter(v => v.isResolved).length;

    const readmissionRate = totalVisits > 0 ? Number(((readmissions / totalVisits) * 100).toFixed(1)) : 0;
    const resolutivityRate = totalVisits > 0 ? Number(((resolvedVisits / totalVisits) * 100).toFixed(1)) : 0;

    return simulateNetworkCall({
      bedOccupancy: bedOccupancy, // %
      averageWaitTime: 24, // minutos (simulado por ahora al no haber timestamp de llegada y atencion precisos en base real)
      readmissionRate: readmissionRate, // %
      resolutivityRate: resolutivityRate, // %
    }, 900, "Error loading advanced metrics.");
  },

  getTopConditions: async () => {
    // Injecting mocked varied data for a better preview experience
    const mockVariedData = [
      { name: "Hipertensión", count: 42 },
      { name: "Diabetes Tipo 2", count: 28 },
      { name: "Asma", count: 18 },
      { name: "Fibrilación Auricular", count: 12 },
      { name: "Postoperatorio Cardíaco", count: 5 }
    ];

    return simulateNetworkCall(mockVariedData, 1100, "Error loading top conditions.");
  },

  getAppointmentsTrends: async () => {
    // Generar datos ficticios agregados con base a datos históricos.
    // Simular los meses recientes para mostrar métricas analíticas complejas.
    const trends = [
      { name: 'Ene', consultas: 45, ingresos: 12 },
      { name: 'Feb', consultas: 52, ingresos: 15 },
      { name: 'Mar', consultas: 48, ingresos: 10 },
      { name: 'Abr', consultas: 61, ingresos: 18 },
      { name: 'May', consultas: 59, ingresos: 14 },
      { name: 'Jun', consultas: 72, ingresos: 21 },
    ];

    return simulateNetworkCall(trends, 1500, "Error loading appointment trends.");
  }
};

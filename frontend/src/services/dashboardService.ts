import { simulateNetworkCall } from '../lib/apiClient';
import { mockDb, TODAY_FORMATTED } from './mockDb';

export const dashboardService = {
  // En el futuro:
  // getKPIs: () => apiClient.get('/dashboard/kpis')
  
  getKPIs: async () => {
    const pacientesAtendidosHoy = mockDb.visits.filter(v => v.date === TODAY_FORMATTED).length;
    const casosCriticos = mockDb.patients.filter(p => p.status === "critico").length;
    const interconsultas = mockDb.patients.filter(p => p.teamCount > 1).length;
    
    const alertas = [];
    const rinitisCount = mockDb.visits.filter(v => v.diagnosis.toLowerCase().includes("rinitis")).length;
    if (rinitisCount >= 2) {
      alertas.push({
        id: "a1", severity: "high", date: "Actualizado en vivo",
        title: "Alerta: Patrón de Rinitis Alérgica",
        description: `El algoritmo de CliniData ha detectado ${rinitisCount} diagnósticos coincidentes en tu centro de salud en las últimas horas. Posible factor ambiental estacional.`
      });
    }
    if (casosCriticos >= 3) {
      alertas.push({
        id: "a2", severity: "medium", date: "Actualizado en vivo",
        title: "Alerta de Capacidad: UCI / Críticos",
        description: `Tienes ${casosCriticos} pacientes en estado crítico actualmente. Se sugiere revisar la carga operativa del equipo de enfermería.`
      });
    }
    
    return simulateNetworkCall({ 
      pacientesAtendidosHoy, 
      casosCriticos, 
      interconsultas, 
      reportsCount: mockDb.reportsCount, 
      alertasEpidemiologicas: alertas 
    }, 1200, "Conexión a métricas rechazada.");
  },

  getSystemEvents: async (page: number, limit: number) => {
    const validEvents = mockDb.events.filter(e => e.type !== "system");
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const result = validEvents.slice(startIndex, endIndex);
    return simulateNetworkCall({ events: result, hasMore: endIndex < validEvents.length }, 800, "Error 503: Servicio no disponible.");
  }
};

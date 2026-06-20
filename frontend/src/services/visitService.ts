import { simulateNetworkCall } from '../lib/apiClient';
import { mockDb } from './mockDb';
import { type GlobalVisit } from "../types";

export const visitService = {
  // En el futuro:
  // getVisits: (patientId) => apiClient.get(`/patients/${patientId}/visits`)
  // addVisit: (patientId, data) => apiClient.post(`/patients/${patientId}/visits`, data)

  getVisitsByPatient: async (patientId: string) => {
    const visits = mockDb.visits.filter(v => v.patientId === patientId);
    return simulateNetworkCall(visits, 600, "Conexión a visitas perdida.");
  },

  addVisit: async (data: Omit<GlobalVisit, "id">) => {
    const newVisit = { ...data, id: `v-${Date.now()}` } as GlobalVisit;
    mockDb.visits = [newVisit, ...mockDb.visits];
    return simulateNetworkCall(newVisit, 800, "Fallo al registrar la visita.");
  }
};

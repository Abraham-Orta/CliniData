import { simulateNetworkCall } from '../lib/apiClient';
import { mockDb } from './mockDb';
import { type ExtendedPatient } from "../types";

export const patientService = {
  // En el futuro:
  // getPatients: (params) => apiClient.get('/patients', { params })
  // createPatient: (data) => apiClient.post('/patients', data)

  getPatients: async (query: string, filterStatus: string, tab: string, page: number) => {
    let filtered = mockDb.patients;
    
    if (tab === "casos-compartidos") {
      filtered = filtered.filter(p => p.teamCount > 1);
    } else {
      filtered = filtered.filter(p => p.teamCount === 1);
    }

    if (filterStatus !== "Todos") {
      const statusMap: any = { "Estable": "estable", "Observación": "observacion", "Crítico": "critico" };
      const s = statusMap[filterStatus];
      if (s) filtered = filtered.filter(p => p.status === s);
    }

    if (query) {
      const lowerQuery = query.toLowerCase();
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(lowerQuery) || 
        p.condition.toLowerCase().includes(lowerQuery)
      );
    }

    const LIMIT = 6;
    const startIndex = (page - 1) * LIMIT;
    const endIndex = startIndex + LIMIT;
    const result = filtered.slice(startIndex, endIndex);

    return simulateNetworkCall({ patients: result, hasMore: endIndex < filtered.length }, 800, "Conexión a base de datos de pacientes perdida.");
  },

  createPatient: async (data: Omit<ExtendedPatient, "id">) => {
    const newPatient = { ...data, id: `p-${Date.now()}` } as ExtendedPatient;
    const savedPatient = await simulateNetworkCall(newPatient, 1000, "Fallo al registrar paciente.");
    
    // Almacenamos en el mock local
    mockDb.patients = [savedPatient, ...mockDb.patients];
    
    return savedPatient;
  },

  getPatientStats: async () => {
    const total = mockDb.patients.length;
    const estables = mockDb.patients.filter(p => p.status === "estable").length;
    const criticos = mockDb.patients.filter(p => p.status === "critico").length;
    const misPacientes = mockDb.patients.filter(p => p.teamCount === 1).length;
    const casosCompartidos = mockDb.patients.filter(p => p.teamCount > 1).length;

    return simulateNetworkCall({
      total,
      estables,
      criticos,
      misPacientes,
      casosCompartidos
    }, 500, "Error al cargar estadísticas de pacientes.");
  },

  getPatientById: async (id: string) => {
    const patient = mockDb.patients.find(p => p.id === id);
    if (!patient) throw new Error("Paciente no encontrado");
    return simulateNetworkCall(patient, 500, "Paciente no encontrado");
  }
};

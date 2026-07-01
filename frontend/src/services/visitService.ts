import { apiClient } from '../lib/apiClient';
import { type GlobalVisit } from "../types";
import { apiConsultaToVisit } from './adapters';

export const visitService = {
  getVisitsByPatient: async (patientId: string) => {
    const consultas = await apiClient.get<any[]>(`/consultas/paciente/${patientId}`);
    return consultas.map(apiConsultaToVisit);
  },

  addVisit: async (data: Omit<GlobalVisit, "id">) => {
    const payload = {
      pacienteId: data.patientId,
      motivo: data.diagnosis || 'Consulta general',
      sintomas: null,
      observaciones: data.notes || null,
      diagnosticos: [],
      tratamientos: (data.prescriptions || []).map((rx) => ({
        medicamento: rx,
        dosis: 'N/A',
        frecuencia: 'N/A',
        duracion: 'N/A',
        indicaciones: null
      }))
    };

    const created = await apiClient.post<any>('/consultas', payload);
    return apiConsultaToVisit(created);
  }
};

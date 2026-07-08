import { apiClient } from '../lib/apiClient';
import { type GlobalVisit } from "../types";
import { apiConsultaToVisit } from './adapters';

export const visitService = {
  getVisitsByPatient: async (patientId: string) => {
    const consultas = await apiClient.get<any[]>(`/consultas/paciente/${patientId}`);
    return consultas.map(apiConsultaToVisit);
  },

  addVisit: async (data: Omit<GlobalVisit, "id"> & { triage?: any }) => {
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

    if (data.triage) {
      Object.assign(payload, data.triage);
    }

    const created = await apiClient.post<any>('/consultas', payload);
    return apiConsultaToVisit(created);
  },

  createTriage: async (patientId: string, triageData: any) => {
    const payload = {
      pacienteId: patientId,
      motivo: triageData.motivo || 'Triaje Inicial',
      sintomas: null,
      observaciones: triageData.observaciones || 'Triaje realizado por Enfermería',
      presionArterial: triageData.presionArterial,
      temperatura: parseFloat(triageData.temperatura) || null,
      frecuenciaCardiaca: parseInt(triageData.frecuenciaCardiaca) || null,
      peso: parseFloat(triageData.peso) || null,
      diagnosticos: [],
      tratamientos: []
    };
    const created = await apiClient.post<any>('/consultas', payload);
    return apiConsultaToVisit(created);
  }
};

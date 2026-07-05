import { apiClient } from '../lib/apiClient';

export interface Colaborador {
  id: string;
  nombre: string;
  apellido: string;
  rolEnCaso?: string;
  isPrimary?: boolean;
}

export const colaboradorService = {
  getMedicosDisponibles: async (): Promise<Colaborador[]> => {
    return apiClient.get<Colaborador[]>('/colaboradores/medicos');
  },
  
  getEquipoPaciente: async (pacienteId: string): Promise<Colaborador[]> => {
    return apiClient.get<Colaborador[]>(`/colaboradores/paciente/${pacienteId}`);
  },

  asignarColaborador: async (pacienteId: string, medicoId: string) => {
    return apiClient.post('/colaboradores/asignar', { pacienteId, medicoId });
  }
};

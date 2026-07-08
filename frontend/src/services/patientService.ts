import { apiClient } from '../lib/apiClient';
import { type ExtendedPatient } from "../types";
import { apiPatientToUi } from './adapters';

type ApiPatientListResponse = {
  data: any[];
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    totalPages?: number;
  };
};

function splitName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const nombre = parts[0] || 'Paciente';
  let apellido = parts.slice(1).join(' ');
  if (!apellido || apellido.length < 2) {
    apellido = 'Sin Apellido';
  }
  return { nombre, apellido };
}

function getBirthDateFromAge(age?: number): string | undefined {
  if (!age || age <= 0) return undefined;
  const d = new Date();
  d.setFullYear(d.getFullYear() - age);
  return d.toISOString().split('T')[0];
}

export const patientService = {
  getPatients: async (query: string, filterStatus: string, tab: string, page: number) => {
    const LIMIT = 6;
    const search = encodeURIComponent(query || '');
    const response = await apiClient.get<ApiPatientListResponse>(
      `/patients?page=${page}&limit=${LIMIT}&search=${search}`
    );

    let filtered = (response.data || []).map(apiPatientToUi);

    // El backend actual no expone teamCount real; mantenemos compatibilidad de tabs con el valor derivado.
    filtered = tab === 'casos-compartidos'
      ? filtered.filter((p) => (p.teamCount || 1) > 1)
      : filtered.filter((p) => (p.teamCount || 1) === 1);

    if (filterStatus !== 'Todos') {
      const statusMap: Record<string, 'estable' | 'observacion' | 'critico'> = {
        Estable: 'estable',
        Observación: 'observacion',
        Crítico: 'critico'
      };
      const target = statusMap[filterStatus];
      if (target) filtered = filtered.filter((p) => p.status === target);
    }

    if (query) {
      const lowerQuery = query.toLowerCase();
      filtered = filtered.filter((p) =>
        p.name.toLowerCase().includes(lowerQuery) || p.condition.toLowerCase().includes(lowerQuery)
      );
    }

    const total = response.meta?.total ?? filtered.length;
    return {
      patients: filtered,
      hasMore: response.meta?.totalPages ? page < response.meta.totalPages : filtered.length >= LIMIT
    };
  },

  createPatient: async (data: Omit<ExtendedPatient, "id"> & { documentId: string }) => {
    const { nombre, apellido } = splitName(data.name);
    const payload = {
      nombre,
      apellido,
      documentoIdentidad: data.documentId,
      fechaNacimiento: getBirthDateFromAge(data.age),
      genero: null,
      telefono: data.phone || null,
      email: null
    };

    const created = await apiClient.post<any>('/patients', payload);
    const mapped = apiPatientToUi(created);
    return {
      ...mapped,
      condition: data.condition || mapped.condition,
      status: data.status || mapped.status,
      bloodType: data.bloodType || mapped.bloodType,
      allergies: data.allergies || mapped.allergies
    };
  },

  updatePatient: async (id: string, data: Partial<ExtendedPatient> & { documentId?: string }) => {
    const payload: any = {};
    if (data.name) {
      const { nombre, apellido } = splitName(data.name);
      payload.nombre = nombre;
      payload.apellido = apellido;
    }
    if (data.documentId) payload.documentoIdentidad = data.documentId;
    if (data.age) payload.fechaNacimiento = getBirthDateFromAge(data.age);
    if (data.phone !== undefined) payload.telefono = data.phone || null;
    
    const updated = await apiClient.put<any>(`/patients/${id}`, payload);
    const mapped = apiPatientToUi(updated);
    return {
      ...mapped,
      condition: data.condition || mapped.condition,
      status: data.status || mapped.status,
      bloodType: data.bloodType || mapped.bloodType,
      allergies: data.allergies || mapped.allergies
    };
  },

  getPatientStats: async () => {
    const response = await apiClient.get<ApiPatientListResponse>('/patients?page=1&limit=200');
    const patients = (response.data || []).map(apiPatientToUi);
    const total = response.meta?.total ?? patients.length;
    const estables = patients.filter((p) => p.status === 'estable').length;
    const criticos = patients.filter((p) => p.status === 'critico').length;
    const misPacientes = patients.filter((p) => (p.teamCount || 1) === 1).length;
    const casosCompartidos = patients.filter((p) => (p.teamCount || 1) > 1).length;

    return {
      total,
      estables,
      criticos,
      misPacientes,
      casosCompartidos
    };
  },

  getPatientById: async (id: string) => {
    const patient = await apiClient.get<any>(`/patients/${id}`);
    return apiPatientToUi(patient);
  }
};

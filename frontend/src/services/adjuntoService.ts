import { apiClient } from '../lib/apiClient';

export interface Adjunto {
  id: string;
  nombre: string;
  ruta: string;
  mimeType: string;
  size: number;
  creadoEn: string;
}

export const adjuntoService = {
  getAdjuntosPaciente: async (pacienteId: string): Promise<Adjunto[]> => {
    return apiClient.get<Adjunto[]>(`/adjuntos/paciente/${pacienteId}`);
  },

  uploadAdjunto: async (consultaId: string, file: File): Promise<Adjunto> => {
    // Para subir archivos con multipart/form-data usamos fetch directo ya que apiClient asume JSON
    const token = localStorage.getItem('auth_token');
    const formData = new FormData();
    formData.append('consultaId', consultaId);
    formData.append('archivo', file);

    const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';
    const response = await fetch(`${API_BASE_URL}/adjuntos/upload`, {
      method: 'POST',
      headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      body: formData
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error al subir archivo: ${errorText}`);
    }

    return response.json();
  }
};

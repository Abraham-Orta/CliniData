import { apiClient } from '../lib/apiClient';

type Doctor = {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
};

export const userService = {
  getDoctors: async (): Promise<Doctor[]> => {
    try {
      const doctors = await apiClient.get<Doctor[]>('/users/doctors');
      return doctors || [];
    } catch (e) {
      console.error('Error fetching doctors:', e);
      return [];
    }
  }
};

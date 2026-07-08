import { apiClient } from '../lib/apiClient';
import { AuditLog } from '../types';

interface AuditResponse {
  data: AuditLog[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const auditService = {
  getAudits: async (page = 1, limit = 20): Promise<AuditResponse> => {
    const response = await apiClient.get<AuditResponse>(`/auditorias?page=${page}&limit=${limit}`);
    return response;
  },
};



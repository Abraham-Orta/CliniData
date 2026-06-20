import { simulateNetworkCall } from '../lib/apiClient';
import { mockDb } from './mockDb';
import { type SystemEvent } from "../types";

export const eventService = {
  // En el futuro:
  // createEvent: (event) => apiClient.post('/events', event)

  createEvent: async (data: Omit<SystemEvent, "id">) => {
    const newEvent = { ...data, id: `ev-${Date.now()}` } as SystemEvent;
    
    // Simula crear el evento en el backend
    mockDb.events = [newEvent, ...mockDb.events];

    return simulateNetworkCall(newEvent, 300, "Error guardando el registro del evento.");
  }
};

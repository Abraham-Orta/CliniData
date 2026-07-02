import { type SystemEvent } from "../types";

// Almacén de eventos en memoria (notificaciones efímeras de sesión)
let sessionEvents: SystemEvent[] = [];

export const eventService = {
  createEvent: async (data: Omit<SystemEvent, "id">): Promise<SystemEvent> => {
    const newEvent = { ...data, id: `ev-${Date.now()}` } as SystemEvent;
    sessionEvents = [newEvent, ...sessionEvents];
    return newEvent;
  },

  getSessionEvents: () => sessionEvents,
  clearSessionEvents: () => { sessionEvents = []; }
};

import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { type SystemEvent, type GlobalAppointment } from "../types";
import { dashboardService } from '../services/dashboardService';

export const AppContext = createContext<any>(null);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [events, setEvents] = useState<SystemEvent[]>([]);
  const [reportsCount, setReportsCount] = useState(24);
  const [activeAppointment, setActiveAppointment] = useState<GlobalAppointment | null>(null);

  // Carga inicial de notificaciones del sistema
  useEffect(() => {
    dashboardService.getSystemEvents(1, 5).then((res) => {
      setEvents(res.events);
    }).catch(err => console.error("Error loading initial events", err));
  }, []);

  const value = {
    events, 
    setEvents, 
    reportsCount, 
    setReportsCount,
    activeAppointment,
    setActiveAppointment
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

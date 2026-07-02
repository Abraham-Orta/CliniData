import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { type SystemEvent, type GlobalAppointment } from "../types";
import { dashboardService } from '../services/dashboardService';

export const AppContext = createContext<any>(null);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [patients, setPatients] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<GlobalAppointment[]>([]);
  const [visits, setVisits] = useState<any[]>([]);
  const [waitlist, setWaitlist] = useState<any[]>([]);
  const [events, setEvents] = useState<SystemEvent[]>([]);
  const [reportsCount, setReportsCount] = useState(0);
  const [activeAppointment, setActiveAppointment] = useState<GlobalAppointment | null>(null);

  // Carga inicial de notificaciones del sistema
  useEffect(() => {
    dashboardService.getSystemEvents(1, 5).then((res: any) => {
      setEvents(res.events);
    }).catch(err => console.error("Error loading initial events", err));
  }, []);

  const value = {
    patients,
    setPatients,
    appointments,
    setAppointments,
    visits,
    setVisits,
    waitlist,
    setWaitlist,
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

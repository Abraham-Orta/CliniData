import React, { useState, useEffect } from "react";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Plus,
  BrainCircuit,
  User,
  Activity,
  UserPlus,
  GripVertical,
  ChevronDown,
  Stethoscope,
  CheckCircle,
  AlertCircle,
  RefreshCcw,
  Loader2,
} from "lucide-react";
import { Sidebar } from "./components/Sidebar";
import { NotificationBell } from "./components/NotificationBell";
import { useAuth } from "./context/AuthContext";
import { useApi } from "./hooks/useApi";
import { appointmentService } from "./services/appointmentService";
import { waitlistService } from "./services/waitlistService";
import { userService } from "./services/userService";

export type VisitType = "rutina" | "control" | "urgencia" | "especialista";


const HORARIOS = [
  "08:00 AM", "08:15 AM", "08:30 AM", "08:45 AM",
  "09:00 AM", "09:15 AM", "09:30 AM", "09:45 AM",
  "10:00 AM", "10:15 AM", "10:30 AM", "10:45 AM",
  "11:00 AM", "11:15 AM", "11:30 AM", "11:45 AM",
  "12:00 PM", "12:15 PM", "12:30 PM", "12:45 PM",
  "01:00 PM", "01:15 PM", "01:30 PM", "01:45 PM",
  "02:00 PM", "02:15 PM", "02:30 PM", "02:45 PM",
  "03:00 PM", "03:15 PM", "03:30 PM", "03:45 PM",
  "04:00 PM", "04:15 PM", "04:30 PM", "04:45 PM",
  "05:00 PM", "05:15 PM", "05:30 PM", "05:45 PM",
  "06:00 PM"
];

const TYPE_CONFIG: Record<string, any> = {
  rutina: { label: "Rutina (30m)", bg: "bg-blue-50", text: "text-[#0B5394]", border: "border-blue-100", duration: 30 },
  control: { label: "Control (15m)", bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-100", duration: 15 },
  urgencia: { label: "Urgencia (60m)", bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-100", duration: 60 },
  especialista: { label: "Especialista (45m)", bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-100", duration: 45 }
};

const VISIT_TYPES_OPTIONS = [
  { value: "rutina", label: "Consulta de Rutina" },
  { value: "control", label: "Control Médico" },
  { value: "especialista", label: "Interconsulta Especialista" },
  { value: "urgencia", label: "Urgencia / Prioridad" },
];
const STATUS_OPTIONS = [
  { value: "confirmada", label: "Confirmada (Asistencia asegurada)" },
  { value: "pendiente", label: "Pendiente / Sin Confirmar" },
];

export function Agenda({ globalState, onNavigate, onLogout, onSettings, onProfile }: any) {
  const { user } = useAuth();
  const safeAppointments = globalState?.appointments || [];
  const safePatients = globalState?.patients || [];
  const safeEvents = globalState?.events || [];
  const [localWaitlist, setLocalWaitlist] = useState<any[]>([]);
  const waitlist = globalState?.waitlist || localWaitlist;
  const setWaitlist = globalState?.setWaitlist || setLocalWaitlist;

  const [doctors, setDoctors] = useState<any[]>([]);
  const [waitlistLoading, setWaitlistLoading] = useState(false);

  const loadWaitlist = async () => {
    setWaitlistLoading(true);
    try {
      const items = await waitlistService.getWaitlist();
      setWaitlist(items);
    } catch (e) {
      console.error("Error loading waitlist:", e);
    } finally {
      setWaitlistLoading(false);
    }
  };

  useEffect(() => {
    loadWaitlist();
    userService.getDoctors().then(setDoctors).catch(err => console.error("Error loading doctors:", err));
  }, []);

  // ESTADO DINÁMICO: Inicia en el día actual
  const [currentDate, setCurrentDate] = useState(new Date());
  const [agendaView, setAgendaView] = useState<"timeline" | "history">(
    "timeline",
  );

  const handlePrevDay = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() - 1);
    setCurrentDate(d);
  };
  const handleNextDay = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + 1);
    setCurrentDate(d);
  };

  const formattedDateUI = currentDate
    .toLocaleDateString("es-ES", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    })
    .replace(/^\w/, (c) => c.toUpperCase());

  const getISODate = (d: Date) => {
    const offset = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() - offset).toISOString().split("T")[0];
  };
  const currentDateStr = getISODate(currentDate);

  const isApptOnCurrentDate = (app: any) => {
    if (!app.date) return currentDateStr === getISODate(new Date());
    return app.date === currentDateStr;
  };

  const [loadedAppointments, setLoadedAppointments] = useState<any[]>(safeAppointments);
  const [isRescheduling, setIsRescheduling] = useState<string | null>(null);

  const { isLoading, error: initialErrorObj, execute: executeLoadAppointments } = useApi(async (dateStr: string) => {
    const res = await appointmentService.getAppointmentsByDate(dateStr, user?.name || "Dr. Rachel Kim");
    setLoadedAppointments(res);
  });
  const hasError = !!initialErrorObj;

  useEffect(() => {
    executeLoadAppointments(currentDateStr);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentDateStr]);

  const loadAppointmentsRetry = () => {
    executeLoadAppointments(currentDateStr);
  };

  const displayAppointments = loadedAppointments;


  const dayAppointments = displayAppointments.filter(
    (a: any) =>
      a.status !== "cancelada" &&
      a.status !== "completada",
  );
  const completedAppointments = displayAppointments.filter(
    (a: any) => 
      a.status === "completada",
  );

  const capacityPct = Math.min(
    Math.round(
      ((dayAppointments.length + completedAppointments.length) /
        HORARIOS.length) *
        100,
    ),
    100,
  );
  let biLevel = "optimo";
  if (capacityPct >= 80) biLevel = "critico";
  else if (capacityPct >= 50) biLevel = "precaucion";
  let biHistorical =
    "Los datos muestran un patrón de demanda estable para el día de hoy.";
  let biSuggestion =
    "Disponibilidad óptima. Puedes agendar rutinas y controles con normalidad.";
  if (currentDate.getDay() === 1) {
    biHistorical =
      "Históricamente, los lunes por la mañana tienen un 20% más de urgencias no programadas.";
    biSuggestion =
      capacityPct > 60
        ? "Día de alta carga. Evita agendar controles; prioriza especialistas y bloquea urgencias."
        : "Mantén al menos 2 huecos libres en la mañana para emergencias.";
  } else if (capacityPct >= 80) {
    biHistorical =
      "La clínica está operando cerca de su límite operativo diario.";
    biSuggestion =
      "Saturación detectada. Deriva cualquier nueva solicitud de rutina para la próxima semana.";
  }

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addForm, setAddForm] = useState({
    patientId: "",
    date: currentDateStr,
    time: "",
    type: "rutina",
    status: "confirmada",
    notes: "",
  });

  const [isPatientOpen, setIsPatientOpen] = useState(false);
  const [isTimeOpen, setIsTimeOpen] = useState(false);
  const [isTypeOpen, setIsTypeOpen] = useState(false);
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [appointmentToCancel, setAppointmentToCancel] = useState<any | null>(
    null,
  );
  const [dragOverSlot, setDragOverSlot] = useState<string | null>(null);
  const [dragOverWaitlist, setDragOverWaitlist] = useState(false);

  const isSlotRangeAvailable = (date: string, startTime: string, duration: number, excludeApptId?: string) => {
    const startIndex = HORARIOS.indexOf(startTime);
    if (startIndex === -1) return false;
    const slotsNeeded = Math.ceil(duration / 15);
    if (startIndex + slotsNeeded > HORARIOS.length) return false;

    const dayAppts = displayAppointments.filter((a: any) => 
      (a.date || currentDateStr) === date && 
      a.status !== "cancelada" && 
      a.id !== excludeApptId
    );

    const occupiedSlots = new Set<string>();
    dayAppts.forEach((app: any) => {
       const appStartIndex = HORARIOS.indexOf(app.time);
       if (appStartIndex !== -1) {
          const appDuration = TYPE_CONFIG[app.type]?.duration || 30;
          const appSlotsNeeded = Math.ceil(appDuration / 15);
          for(let i = 0; i < appSlotsNeeded; i++) {
             if (appStartIndex + i < HORARIOS.length) {
                occupiedSlots.add(HORARIOS[appStartIndex + i]);
             }
          }
       }
    });

    const requiredSlots = HORARIOS.slice(startIndex, startIndex + slotsNeeded);
    return requiredSlots.every(slot => !occupiedSlots.has(slot));
  };

  const modalAvailableTimes = HORARIOS.filter(
    (h) => isSlotRangeAvailable(addForm.date, h, TYPE_CONFIG[addForm.type]?.duration || 30)
  );

  const { execute: executeStatusChange } = useApi(async (id: string, newStatus: string) => {
    setIsRescheduling(id);
    try {
      await appointmentService.updateAppointment(id, { status: newStatus as "pendiente" | "completada" | "confirmada" | "cancelada" });
      executeLoadAppointments(currentDateStr); // Refetch appointments
    } finally {
      setIsRescheduling(null);
    }
  });

  const handleStatusChange = async (id: string, newStatus: string) => {
    executeStatusChange(id, newStatus);
  };

  const { isLoading: isSubmitting, execute: executeAddAppointment } = useApi(async (newAppointmentData: any) => {
    await appointmentService.createAppointment(newAppointmentData);
    executeLoadAppointments(currentDateStr); // refresh schedule

    globalState?.setEvents([
      {
        id: `ev-${Date.now()}`,
        type: "update",
        doctorName: user?.name || "Dr. Rachel Kim",
        action: "agendó una nueva consulta para",
        patientName: newAppointmentData.patientName,
        timeAgo: "Justo ahora",
        read: true,
      },
      ...safeEvents,
    ]);
    setIsAddModalOpen(false);
    setAddForm({
      patientId: "",
      date: currentDateStr,
      time: "",
      type: "rutina",
      status: "confirmada",
      notes: "",
    });
  });

  const handleNewAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addForm.patientId || !addForm.time) {
      alert("Por favor seleccione un paciente y una hora libre.");
      return;
    }
    const selectedPatient = safePatients.find(
      (p: any) => p.id === addForm.patientId,
    );
    const newAppointmentData = {
      patientId: addForm.patientId,
      date: addForm.date,
      time: addForm.time,
      patientName: selectedPatient?.name || "Paciente Desconocido",
      doctorName: user?.name || "Dr. Rachel Kim",
      type: addForm.type,
      status: addForm.status,
      notes: addForm.notes,
    };
    
    executeAddAppointment(newAppointmentData);
  };

  const handleCancelToWaitlist = async () => {
    if (!appointmentToCancel) return;
    try {
      await appointmentService.updateAppointment(appointmentToCancel.id, { status: "cancelada" });
      await waitlistService.addToWaitlist({
        pacienteId: appointmentToCancel.patientId,
        urgencia: "media",
        tipoRequerido: appointmentToCancel.type,
        notas: "Cancelación y reprogramación"
      });
      executeLoadAppointments(currentDateStr);
      loadWaitlist();

      globalState?.setEvents([
        {
          id: `ev-${Date.now()}`,
          type: "update",
          doctorName: user?.name || "Dr. Rachel Kim",
          action: "movió a lista de espera la cita de",
          patientName: appointmentToCancel.patientName,
          timeAgo: "Justo ahora",
          read: true,
        },
        ...safeEvents,
      ]);
    } catch (e) {
      console.error("Error moving to waitlist:", e);
      alert("Error al mover la cita a la lista de espera.");
    } finally {
      setAppointmentToCancel(null);
    }
  };

  const handleCancelDefinitive = async () => {
    if (!appointmentToCancel) return;
    try {
      await appointmentService.updateAppointment(appointmentToCancel.id, { status: "cancelada" });
      executeLoadAppointments(currentDateStr);

      globalState?.setEvents([
        {
          id: `ev-${Date.now()}`,
          type: "alert",
          doctorName: user?.name || "Dr. Rachel Kim",
          action: "canceló definitivamente la cita de",
          patientName: appointmentToCancel.patientName,
          timeAgo: "Justo ahora",
          read: true,
        },
        ...safeEvents,
      ]);
    } catch (e) {
      console.error("Error cancelling appointment:", e);
      alert("Error al cancelar la cita.");
    } finally {
      setAppointmentToCancel(null);
    }
  };

  const handleDragStart = (
    e: React.DragEvent,
    type: "waitlist" | "appointment",
    payload: any,
  ) => {
    e.dataTransfer.setData(
      "application/json",
      JSON.stringify({ type, payload }),
    );
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDropOnSlot = async (e: React.DragEvent, targetTime: string) => {
    e.preventDefault();
    setDragOverSlot(null);
    const dataStr = e.dataTransfer.getData("application/json");
    if (!dataStr) return;
    const { type, payload } = JSON.parse(dataStr);
    
    if (type === "waitlist") {
      const wlPatient = waitlist.find((w: any) => w.id === payload.id);
      if (!wlPatient) return;
      
      const duration = TYPE_CONFIG[wlPatient.requiredType]?.duration || 30;
      if (!isSlotRangeAvailable(currentDateStr, targetTime, duration)) {
        alert(`No hay suficiente espacio continuo (${duration} min) a las ${targetTime}.`);
        return;
      }
      
      setIsRescheduling(payload.id);
      try {
        await appointmentService.createAppointment({
          patientId: wlPatient.patientId,
          date: currentDateStr,
          time: targetTime,
          patientName: wlPatient.patientName,
          type: wlPatient.requiredType,
          status: "confirmada",
          doctorId: user?.id || ''
        });
        await waitlistService.removeFromWaitlist(payload.id);
        executeLoadAppointments(currentDateStr);
        loadWaitlist();
        globalState?.setEvents([
          {
            id: `ev-${Date.now()}`,
            type: "assignment",
            doctorName: user?.name || "Dr. Rachel Kim",
            action: "asignó un bloque a",
            patientName: wlPatient.patientName,
            timeAgo: "Justo ahora",
            read: true,
          },
          ...safeEvents,
        ]);
      } catch(err) { console.error(err); } finally { setIsRescheduling(null); }
      
    } else if (type === "appointment") {
      const appnt = displayAppointments.find((a: any) => a.id === payload.id);
      if (!appnt) return;

      const duration = TYPE_CONFIG[appnt.type]?.duration || 30;
      if (!isSlotRangeAvailable(currentDateStr, targetTime, duration, payload.id)) {
        alert(`El espacio requerido (${duration} min) colisiona con otra cita.`);
        return;
      }

      setIsRescheduling(payload.id);
      try {
        await appointmentService.updateAppointment(payload.id, { time: targetTime, date: currentDateStr });
        executeLoadAppointments(currentDateStr);
      } catch(err) { console.error(err); } finally { setIsRescheduling(null); }
    }
  };

  const handleDropOnWaitlist = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverWaitlist(false);
    const dataStr = e.dataTransfer.getData("application/json");
    if (!dataStr) return;
    const { type, payload } = JSON.parse(dataStr);
    if (type === "appointment") {
      const appt = displayAppointments.find((a: any) => a.id === payload.id);
      if (!appt) return;
      try {
        await appointmentService.updateAppointment(payload.id, { status: "cancelada" });
        await waitlistService.addToWaitlist({
          pacienteId: appt.patientId,
          urgencia: "media",
          tipoRequerido: appt.type,
          notas: "Movido a lista de espera"
        });
        executeLoadAppointments(currentDateStr);
        loadWaitlist();
      } catch (err) {
        console.error("Error moving to waitlist:", err);
      }
    }
  };

  return (
    <div
      className="flex h-screen w-full overflow-hidden bg-[#F8FAFC]"
      style={{ fontFamily: "Inter, sans-serif" }}
    >
      <Sidebar
        onNavigate={onNavigate}
        onSettingsClick={onSettings}
        onLogoutClick={onLogout}
        onProfileClick={onProfile}
      />
      <main className="flex-1 flex flex-col overflow-hidden relative">
        <header className="flex flex-col sm:flex-row sm:items-center justify-between px-8 py-5 bg-white border-b border-slate-100 sticky top-0 z-20 gap-4">
          <div className="flex items-center gap-6">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                Agenda Inteligente
              </h1>
              <p className="text-sm font-medium text-slate-400 mt-1">
                Gestión operativa y asignación de bloques
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <NotificationBell globalState={globalState} />
            <div className="w-px h-6 bg-slate-200 hidden md:block"></div>
            <div className="flex items-center gap-4 bg-slate-50 p-1.5 rounded-xl border border-slate-100 shadow-sm shrink-0">
              <button
                onClick={handlePrevDay}
                className="p-2 rounded-lg text-slate-400 hover:text-[#0E7490] hover:bg-white transition-all"
              >
                <ChevronLeft size={18} strokeWidth={2.5} />
              </button>
              <div className="flex items-center gap-2 px-3 font-bold text-slate-700 text-sm min-w-[200px] justify-center">
                <CalendarIcon size={16} className="text-[#0E7490]" />
                {formattedDateUI}
              </div>
              <button
                onClick={handleNextDay}
                className="p-2 rounded-lg text-slate-400 hover:text-[#0E7490] hover:bg-white transition-all"
              >
                <ChevronRight size={18} strokeWidth={2.5} />
              </button>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-8 max-w-7xl mx-auto h-full">
            <section className="xl:col-span-3 flex flex-col">
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm flex-1 p-6 relative">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                  <div className="flex bg-slate-100 p-1 rounded-xl shadow-inner w-max">
                    <button
                      onClick={() => setAgendaView("timeline")}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${agendaView === "timeline" ? "bg-white text-[#0B5394] shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                    >
                      <Clock size={16} /> Pendientes
                    </button>
                    <button
                      onClick={() => setAgendaView("history")}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${agendaView === "history" ? "bg-white text-emerald-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                    >
                      <CheckCircle size={16} /> Completadas{" "}
                      <span className="ml-1 px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-700 text-[10px]">
                        {completedAppointments.length}
                      </span>
                    </button>
                  </div>

                  <button
                    onClick={() => {
                      setAddForm((prev) => ({ ...prev, date: currentDateStr }));
                      setIsAddModalOpen(true);
                    }}
                    className="px-4 py-2.5 flex items-center justify-center gap-2 text-white text-sm font-bold rounded-xl shadow-[0_4px_14px_rgba(11,83,148,0.35)] hover:-translate-y-0.5 bg-gradient-to-r from-[#0B5394] to-[#0E7490] transition-all duration-200"
                  >
                    <Plus size={16} strokeWidth={2.5} /> Nueva Cita
                  </button>
                </div>

                {isLoading ? (
                  <div className="space-y-4 pb-10 animate-pulse">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="flex gap-6">
                        <div className="w-20 shrink-0 text-right pt-4"><div className="h-4 w-12 bg-slate-200 rounded ml-auto"></div></div>
                        <div className="flex-1">
                          <div className="w-full h-24 bg-slate-100 rounded-xl border border-slate-200 p-4">
                            <div className="h-5 w-32 bg-slate-200 rounded mb-2"></div>
                            <div className="h-3 w-48 bg-slate-200 rounded"></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : hasError ? (
                  <div className="text-center py-16 bg-rose-50 rounded-2xl border border-rose-100">
                    <AlertCircle size={48} className="mx-auto text-rose-400 mb-4" />
                    <h3 className="text-lg font-bold text-slate-800 mb-2">Error de conexión</h3>
                    <p className="text-slate-500 mb-6 w-2/3 mx-auto">No se pudo cargar la agenda desde el servidor central. Revisa tu conexión a internet e inténtalo de nuevo.</p>
                    <button onClick={loadAppointmentsRetry} className="px-6 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-700 font-bold hover:bg-slate-50 shadow-sm transition-all flex items-center justify-center gap-2 mx-auto">
                      <RefreshCcw size={16} /> Reintentar conexión
                    </button>
                  </div>
                ) : agendaView === "timeline" ? (
                  <div className="space-y-4 pb-10">
                    {(() => {
                      let skipUntilIndex = -1;
                      return HORARIOS.map((hour, index) => {
                        if (index < skipUntilIndex) return null;

                        const appointment = dayAppointments.find(
                          (a: any) => a.time === hour,
                        );
                        const isDragOver = dragOverSlot === hour;
                        
                        if (appointment) {
                          const duration = TYPE_CONFIG[appointment.type]?.duration || 30;
                          const slotsToCover = duration / 15;
                          skipUntilIndex = index + slotsToCover;
                        }

                        return (
                          <div
                            key={hour}
                            className="flex flex-col sm:flex-row gap-4 sm:gap-6 relative group"
                          >
                            <div className="w-20 shrink-0 text-right pt-4 sm:pt-3">
                              <span className="text-sm font-bold text-slate-500 group-hover:text-[#0E7490] transition-colors relative">
                                {hour}
                              </span>
                            </div>
                            <div className="flex-1 relative">
                              <div className="absolute top-[22px] sm:top-[20px] left-0 right-0 h-px bg-slate-100 z-0"></div>
  
                              <div
                                onDragOver={(e) => {
                                  e.preventDefault();
                                  if (!appointment) setDragOverSlot(hour);
                                }}
                                onDragLeave={() => setDragOverSlot(null)}
                                onDrop={(e) => {
                                  if (!appointment) handleDropOnSlot(e, hour);
                                }}
                                className={`relative z-10 w-full transition-all duration-200 ${isDragOver ? "scale-[1.02] bg-slate-50 rounded-xl" : ""}`}
                                style={!appointment ? { minHeight: "48px" } : {}}
                              >
                                {appointment ? (
                                  <div
                                    draggable={isRescheduling !== appointment.id}
                                    onDragStart={(e) =>
                                      handleDragStart(e, "appointment", {
                                        id: appointment.id,
                                      })
                                    }
                                    className={`w-full p-4 rounded-xl border bg-white shadow-sm hover:shadow-md transition-all ${isRescheduling === appointment.id ? "opacity-60 cursor-not-allowed" : "cursor-grab active:cursor-grabbing"} hover:border-[#0E7490]/40 ${TYPE_CONFIG[appointment.type]?.border}`}
                                  >
                                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 relative">
                                    <div className="flex gap-4 items-stretch">
                                      <div
                                        className={`w-1.5 rounded-full shrink-0 ${TYPE_CONFIG[appointment.type]?.bg.replace("50", "400")}`}
                                      ></div>
                                      <div className="flex flex-col py-1">
                                        <div>
                                          <div className="flex flex-wrap items-center gap-2 mb-1">
                                            <h4 className="text-base font-bold text-slate-900 leading-tight block">
                                              {appointment.patientName}
                                            </h4>
                                            <span
                                              className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${TYPE_CONFIG[appointment.type]?.bg} ${TYPE_CONFIG[appointment.type]?.text}`}
                                            >
                                              {TYPE_CONFIG[appointment.type]?.label}
                                            </span>
                                            {appointment.status ===
                                              "pendiente" && (
                                              <span className="px-2 py-0.5 bg-amber-50 text-amber-600 text-[10px] font-bold uppercase rounded-md border border-amber-100">
                                                Sin confirmar
                                              </span>
                                            )}
                                          </div>
                                          <p className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
                                            <GripVertical
                                              size={12}
                                              className="text-slate-300"
                                            />{" "}
                                            {appointment.notes ||
                                              "Arrastra la tarjeta para re-agendar"}
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0 md:absolute md:top-0 md:right-0 ml-[22px] md:ml-0">
                                      {appointment.status === "pendiente" && (
                                        <button
                                          onClick={() =>
                                            handleStatusChange(
                                              appointment.id,
                                              "confirmada",
                                            )
                                          }
                                          className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                          title="Confirmar asistencia"
                                        >
                                          <CheckCircle2
                                            size={18}
                                            strokeWidth={2.5}
                                          />
                                        </button>
                                      )}
                                      {appointment.status === "confirmada" && (
                                        <button
                                          onClick={() =>
                                            globalState?.handleStartConsultation(
                                              appointment,
                                              appointment.patientId,
                                            )
                                          }
                                          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 transition-colors shadow-[0_2px_10px_rgba(5,150,105,0.3)]"
                                        >
                                          <Stethoscope size={14} /> Atender
                                        </button>
                                      )}
                                      <button
                                        onClick={() =>
                                          setAppointmentToCancel(appointment)
                                        }
                                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                        title="Cancelar cita"
                                      >
                                        <XCircle size={18} strokeWidth={2.5} />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <div
                                  className={`w-full h-16 rounded-xl border border-dashed flex items-center justify-center transition-all ${isDragOver ? "border-[#0B5394] bg-cyan-50/50 shadow-inner" : "border-slate-200 bg-slate-50/30 opacity-0 group-hover:opacity-100"}`}
                                >
                                  <span
                                    className={`text-sm font-bold flex items-center gap-2 ${isDragOver ? "text-[#0B5394]" : "text-slate-400"}`}
                                  >
                                    {isDragOver ? (
                                      "Soltar para agendar aquí"
                                    ) : (
                                      <>
                                        <Plus size={16} /> Espacio disponible
                                      </>
                                    )}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })})()}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {completedAppointments.length === 0 ? (
                      <div className="text-center py-10">
                        <p className="text-slate-500 font-medium">
                          No has completado ninguna consulta el día de hoy.
                        </p>
                      </div>
                    ) : (
                      completedAppointments.map((app: any) => (
                        <div
                          key={app.id}
                          onClick={() =>
                            globalState?.handlePatientSelect(
                              safePatients.find(
                                (p: any) => p.id === app.patientId,
                              ),
                            )
                          }
                          className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-slate-50 hover:border-[#0E7490]/40 hover:shadow-sm cursor-pointer transition-all group"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                              <CheckCircle2 size={20} />
                            </div>
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="text-sm font-bold text-slate-900 group-hover:text-[#0E7490]">
                                  {app.patientName}
                                </h4>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-md">
                                  Atendido a las {app.time}
                                </span>
                              </div>
                              <p className="text-xs font-medium text-slate-500">
                                Haz clic para ver la historia médica detallada.
                              </p>
                            </div>
                          </div>
                          <ChevronRight
                            size={18}
                            className="text-slate-400 group-hover:text-[#0E7490]"
                          />
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </section>

            <section className="xl:col-span-1 flex flex-col gap-6">
              <div
                className={`rounded-2xl border p-5 shadow-sm transition-colors ${biLevel === "critico" ? "bg-rose-50/30 border-rose-100" : biLevel === "precaucion" ? "bg-amber-50/30 border-amber-100" : "bg-white border-slate-100"}`}
              >
                <div className="flex items-center gap-2 mb-4">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center text-white ${biLevel === "optimo" ? "bg-[#0E7490]" : biLevel === "critico" ? "bg-rose-500" : "bg-amber-500"}`}
                  >
                    <BrainCircuit size={16} />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Análisis del Día
                  </h3>
                </div>
                <div className="mb-4">
                  <div className="flex items-end justify-between mb-1">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Capacidad Operativa
                    </span>
                    <span
                      className={`text-xl font-black ${biLevel === "optimo" ? "text-[#0E7490]" : biLevel === "critico" ? "text-rose-600" : "text-amber-600"}`}
                    >
                      {capacityPct}%
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                    <div
                      className={`h-full rounded-full transition-all duration-1000 ${biLevel === "optimo" ? "bg-gradient-to-r from-[#0B5394] to-[#0E7490]" : biLevel === "critico" ? "bg-rose-500" : "bg-amber-500"}`}
                      style={{ width: `${capacityPct}%` }}
                    ></div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <Activity
                      size={14}
                      className="text-slate-400 shrink-0 mt-0.5"
                    />
                    <p className="text-xs font-medium text-slate-600 leading-relaxed">
                      {biHistorical}
                    </p>
                  </div>
                  <div
                    className={`flex items-start gap-2 p-3 rounded-lg border bg-white/80 ${biLevel === "optimo" ? "border-emerald-100" : "border-amber-100"}`}
                  >
                    <AlertTriangle
                      size={14}
                      className={`shrink-0 mt-0.5 ${biLevel === "optimo" ? "text-emerald-500" : "text-amber-600"}`}
                    />
                    <p
                      className={`text-xs font-bold leading-relaxed ${biLevel === "optimo" ? "text-emerald-700" : "text-amber-800"}`}
                    >
                      Sugerencia:{" "}
                      <span className="font-medium">{biSuggestion}</span>
                    </p>
                  </div>
                </div>
              </div>

              <div
                className={`rounded-2xl border shadow-sm flex-1 p-5 flex flex-col transition-all ${dragOverWaitlist ? "bg-cyan-50/50 border-[#0B5394]" : "bg-white border-slate-100"}`}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOverWaitlist(true);
                }}
                onDragLeave={() => setDragOverWaitlist(false)}
                onDrop={handleDropOnWaitlist}
              >
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <User size={16} className="text-[#0E7490]" /> Lista de
                    Espera
                  </h3>
                  <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs font-bold rounded-md">
                    {waitlist.length}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 font-medium mb-3 text-center uppercase tracking-widest border-b border-dashed border-slate-200 pb-2">
                  Arrastra pacientes hacia el calendario
                </p>
                <div className="flex flex-col gap-3 flex-1">
                  {waitlist.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
                      <p className="text-xs text-slate-400 font-medium">
                        No hay pacientes en espera.
                      </p>
                    </div>
                  ) : (
                    waitlist.map((patient: any) => {
                      const typeConf = TYPE_CONFIG[patient.requiredType];
                      return (
                        <div
                          key={patient.id}
                          draggable
                          onDragStart={(e) =>
                            handleDragStart(e, "waitlist", { id: patient.id })
                          }
                          className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 cursor-grab active:cursor-grabbing hover:border-[#0E7490]/50 hover:shadow-sm transition-all group"
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="text-sm font-bold text-slate-900 mb-1 flex items-center gap-1.5">
                                <GripVertical
                                  size={13}
                                  className="text-slate-400 opacity-50 group-hover:opacity-100"
                                />
                                {patient.patientName}
                              </h4>
                              <div className="flex items-center gap-2 pl-4">
                                <span
                                  className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider ${typeConf?.bg} ${typeConf?.text}`}
                                >
                                  {typeConf?.label}
                                </span>
                                {patient.urgency === "alta" && (
                                  <span className="text-[10px] font-bold text-red-600 flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse"></span>{" "}
                                    Urgente
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>

      {/* --- MODAL NUEVA CITA CON MENÚS DESPLEGABLES PERSONALIZADOS --- */}
      {isAddModalOpen && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 bg-slate-900/40 backdrop-blur-sm p-4 overflow-y-auto"
          onClick={() => {
            setIsAddModalOpen(false);
            setIsPatientOpen(false);
            setIsTimeOpen(false);
            setIsTypeOpen(false);
            setIsStatusOpen(false);
          }}
        >
          <div
            className="w-full max-w-md bg-white rounded-2xl shadow-2xl flex flex-col my-auto border border-slate-100"
            onClick={(e) => {
              e.stopPropagation();
              setIsPatientOpen(false);
              setIsTimeOpen(false);
              setIsTypeOpen(false);
              setIsStatusOpen(false);
            }}
          >
            <div className="flex items-center gap-3 px-6 py-5 bg-gradient-to-r from-[#0B5394] to-[#0E7490] text-white rounded-t-2xl shadow-sm">
              <CalendarIcon size={20} />
              <h3 className="text-lg font-bold">Agendar Nueva Cita</h3>
            </div>

            <form
              onSubmit={handleNewAppointment}
              className="p-6 flex flex-col gap-4"
            >
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">
                  Paciente <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <UserPlus
                    size={16}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 z-10"
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsPatientOpen(!isPatientOpen);
                      setIsTimeOpen(false);
                      setIsTypeOpen(false);
                      setIsStatusOpen(false);
                    }}
                    className="w-full pl-10 pr-4 py-3 border-[1.5px] border-slate-200 rounded-xl text-sm flex justify-between items-center outline-none transition-all bg-[#F8FAFC] hover:bg-[#FAFCFF] text-slate-700 font-medium"
                    style={{ borderColor: isPatientOpen ? "#0B5394" : "" }}
                  >
                    <span className={addForm.patientId ? "" : "text-slate-400"}>
                      {safePatients.find((p: any) => p.id === addForm.patientId)
                        ? `${safePatients.find((p: any) => p.id === addForm.patientId)?.name}`
                        : "Seleccione un paciente..."}
                    </span>
                    <ChevronDown
                      size={14}
                      className={`text-slate-400 transition-transform ${isPatientOpen ? "rotate-180" : ""}`}
                    />
                  </button>

                  {isPatientOpen && (
                    <div className="absolute top-[calc(100%+4px)] left-0 right-0 bg-white border border-slate-200 rounded-xl shadow-xl z-[60] max-h-48 overflow-y-auto">
                      {safePatients.map((p: any) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setAddForm({ ...addForm, patientId: p.id });
                            setIsPatientOpen(false);
                          }}
                          className={`w-full text-left px-4 py-3 text-sm transition-colors ${addForm.patientId === p.id ? "bg-cyan-50 text-[#0E7490] font-semibold" : "text-slate-700 hover:bg-slate-50"}`}
                        >
                          {p.name} - {p.condition}
                        </button>
                      ))}
                      {safePatients.length === 0 && (
                        <div className="px-4 py-3 text-sm text-slate-500">
                          No hay pacientes disponibles
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-1/2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">
                    Fecha
                  </label>
                  <input
                    type="date"
                    required
                    value={addForm.date}
                    onChange={(e) =>
                      setAddForm({ ...addForm, date: e.target.value })
                    }
                    className="w-full px-4 py-3 border-[1.5px] border-slate-200 rounded-xl text-sm outline-none focus:border-[#0B5394] focus:ring-1 focus:ring-[#0B5394] bg-[#F8FAFC] focus:bg-[#FAFCFF] cursor-pointer text-slate-700"
                  />
                </div>

                <div className="w-1/2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">
                    Hora Libre <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsTimeOpen(!isTimeOpen);
                        setIsPatientOpen(false);
                        setIsTypeOpen(false);
                        setIsStatusOpen(false);
                      }}
                      className="w-full px-4 py-3 border-[1.5px] border-slate-200 rounded-xl text-sm flex justify-between items-center outline-none transition-all bg-[#F8FAFC] hover:bg-[#FAFCFF] text-slate-700 font-bold"
                      style={{ borderColor: isTimeOpen ? "#0B5394" : "" }}
                    >
                      <span
                        className={
                          addForm.time ? "" : "text-slate-400 font-medium"
                        }
                      >
                        {addForm.time || "Seleccione hora"}
                      </span>
                      <ChevronDown
                        size={14}
                        className={`text-slate-400 transition-transform ${isTimeOpen ? "rotate-180" : ""}`}
                      />
                    </button>
                    {isTimeOpen && (
                      <div className="absolute top-[calc(100%+4px)] left-0 right-0 bg-white border border-slate-200 rounded-xl shadow-xl z-[60] max-h-48 overflow-y-auto">
                        {modalAvailableTimes.length > 0 ? (
                          modalAvailableTimes.map((t: string) => (
                            <button
                              key={t}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setAddForm({ ...addForm, time: t });
                                setIsTimeOpen(false);
                              }}
                              className={`w-full text-left px-4 py-3 text-sm transition-colors ${addForm.time === t ? "bg-cyan-50 text-[#0E7490] font-semibold" : "text-slate-700 hover:bg-slate-50"}`}
                            >
                              {t}
                            </button>
                          ))
                        ) : (
                          <div className="px-4 py-3 text-sm text-slate-500">
                            No hay horas libres
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">
                  Motivo de Visita
                </label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsTypeOpen(!isTypeOpen);
                      setIsPatientOpen(false);
                      setIsTimeOpen(false);
                      setIsStatusOpen(false);
                    }}
                    className="w-full px-4 py-3 border-[1.5px] border-slate-200 rounded-xl text-sm flex justify-between items-center outline-none transition-all bg-[#F8FAFC] hover:bg-[#FAFCFF] text-slate-700 font-medium"
                    style={{ borderColor: isTypeOpen ? "#0B5394" : "" }}
                  >
                    <span>
                      {
                        VISIT_TYPES_OPTIONS.find(
                          (o) => o.value === addForm.type,
                        )?.label
                      }
                    </span>
                    <ChevronDown
                      size={14}
                      className={`text-slate-400 transition-transform ${isTypeOpen ? "rotate-180" : ""}`}
                    />
                  </button>
                  {isTypeOpen && (
                    <div className="absolute top-[calc(100%+4px)] left-0 right-0 bg-white border border-slate-200 rounded-xl shadow-xl z-[60] overflow-hidden">
                      {VISIT_TYPES_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setAddForm({ ...addForm, type: opt.value });
                            setIsTypeOpen(false);
                          }}
                          className={`w-full text-left px-4 py-3 text-sm transition-colors ${addForm.type === opt.value ? "bg-cyan-50 text-[#0E7490] font-semibold" : "text-slate-700 hover:bg-slate-50"}`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">
                  Estado de la Cita
                </label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsStatusOpen(!isStatusOpen);
                      setIsPatientOpen(false);
                      setIsTimeOpen(false);
                      setIsTypeOpen(false);
                    }}
                    className="w-full px-4 py-3 border-[1.5px] border-slate-200 rounded-xl text-sm flex justify-between items-center outline-none transition-all bg-[#F8FAFC] hover:bg-[#FAFCFF] text-slate-700 font-medium"
                    style={{ borderColor: isStatusOpen ? "#0B5394" : "" }}
                  >
                    <span>
                      {STATUS_OPTIONS.find((o) => o.value === addForm.status)
                        ?.label || "Confirmada"}
                    </span>
                    <ChevronDown
                      size={14}
                      className={`text-slate-400 transition-transform ${isStatusOpen ? "rotate-180" : ""}`}
                    />
                  </button>
                  {isStatusOpen && (
                    <div className="absolute top-[calc(100%+4px)] left-0 right-0 bg-white border border-slate-200 rounded-xl shadow-xl z-[60] overflow-hidden">
                      {STATUS_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setAddForm({ ...addForm, status: opt.value });
                            setIsStatusOpen(false);
                          }}
                          className={`w-full text-left px-4 py-3 text-sm transition-colors ${addForm.status === opt.value ? "bg-cyan-50 text-[#0E7490] font-semibold" : "text-slate-700 hover:bg-slate-50"}`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">
                  Notas Internas
                </label>
                <textarea
                  rows={2}
                  value={addForm.notes}
                  onChange={(e) =>
                    setAddForm({ ...addForm, notes: e.target.value })
                  }
                  placeholder="Recomendaciones para recepción o pre-clínica..."
                  className="w-full px-4 py-3 border-[1.5px] border-slate-200 rounded-xl text-sm outline-none focus:border-[#0B5394] focus:ring-1 focus:ring-[#0B5394] bg-[#F8FAFC] focus:bg-[#FAFCFF] resize-none"
                />
              </div>

              <div className="flex gap-3 mt-3 pt-5 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  disabled={isSubmitting}
                  className="flex-1 py-3 rounded-xl font-semibold text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 flex items-center justify-center gap-2 py-3 font-bold text-white rounded-xl shadow-[0_4px_14px_rgba(11,83,148,0.35)] hover:shadow-[0_6px_20px_rgba(11,83,148,0.45)] hover:-translate-y-0.5 bg-gradient-to-r from-[#0B5394] to-[#0E7490] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? <><Loader2 size={16} className="animate-spin" /> Agendando...</> : "Confirmar Cita"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL DE CANCELACIÓN (NUEVO) --- */}
      {appointmentToCancel && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 bg-slate-900/40 backdrop-blur-sm p-4 overflow-y-auto"
          onClick={() => setAppointmentToCancel(null)}
        >
          <div
            className="w-full max-w-md bg-white rounded-2xl shadow-2xl flex flex-col my-auto border border-slate-100 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={24} className="text-rose-500" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 text-center mb-2">
              Cancelar Cita
            </h3>
            <p className="text-sm text-slate-500 text-center mb-6">
              ¿Qué deseas hacer con la cita de{" "}
              <strong>{appointmentToCancel.patientName}</strong> a las{" "}
              <strong>{appointmentToCancel.time}</strong>?
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={handleCancelToWaitlist}
                className="w-full py-3 rounded-xl font-bold text-white shadow-[0_4px_14px_rgba(245,158,11,0.35)] hover:shadow-[0_6px_20px_rgba(245,158,11,0.45)] hover:-translate-y-0.5 bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-200 flex items-center justify-center gap-2"
              >
                <UserPlus size={16} /> Mover a Lista de Espera
              </button>
              <button
                onClick={handleCancelDefinitive}
                className="w-full py-3 rounded-xl font-bold text-white shadow-[0_4px_14px_rgba(225,29,72,0.35)] hover:shadow-[0_6px_20px_rgba(225,29,72,0.45)] hover:-translate-y-0.5 bg-gradient-to-r from-rose-500 to-red-600 transition-all duration-200 flex items-center justify-center gap-2"
              >
                <XCircle size={16} /> Cancelar Definitivamente
              </button>
              <button
                onClick={() => setAppointmentToCancel(null)}
                className="w-full py-3 rounded-xl border-2 border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-sm transition-colors"
              >
                Mantener Cita
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

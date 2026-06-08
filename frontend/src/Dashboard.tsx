import { useState, useEffect } from "react";
import { 
  Users, Activity, Share2, FileText, TrendingUp, TrendingDown, 
  AlertTriangle, Clock, ChevronRight, PlayCircle, ShieldAlert, 
  Edit3, Pill, UserPlus, Calendar as CalendarIcon, Loader2,
  WifiOff, RefreshCw
} from "lucide-react";
import { Sidebar } from "./components/Sidebar";

import { NotificationBell } from "./components/NotificationBell";
import { useApi } from "./hooks/useApi";
import { dashboardService } from "./services/dashboardService";
import { appointmentService } from "./services/appointmentService";

// Configuración visual para la agenda
const typeConfig: Record<string, any> = {
  rutina: { label: "Rutina", bg: "bg-blue-50", text: "text-[#0B5394]" },
  control: { label: "Control", bg: "bg-emerald-50", text: "text-emerald-700" },
  urgencia: { label: "Urgencia", bg: "bg-rose-50", text: "text-rose-700" },
  especialista: { label: "Especialista", bg: "bg-purple-50", text: "text-purple-700" }
};

export function Dashboard({ globalState, onNavigate, onLogout, onSettings, onProfile }: any) {
  const { patients, visits, appointments, events, reportsCount } = globalState;

  // --- FECHA DINÁMICA ---
  const today = new Date();
  const dynamicDateText = today.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).replace(/^\w/, (c) => c.toUpperCase());
  const monthsEs = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
  const todayFormatted = `${today.getDate()} ${monthsEs[today.getMonth()]}, ${today.getFullYear()}`;

  // ========================================================
  // ESTADOS DE CARGA PROGRESIVA, ASINCRONÍA Y ERRORES
  // ========================================================
  const [actividadReciente, setActividadReciente] = useState<any[]>([]);
  const [activityPage, setActivityPage] = useState(1);
  const [hasMoreEvents, setHasMoreEvents] = useState(true);
  
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const { data: kpiData, isLoading: isLoadingKPIs, error: errorKPIsObj, execute: loadKPIs } = useApi(dashboardService.getKPIs);
  const errorKPIs = !!errorKPIsObj;

  const { data: proximasConsultasList, isLoading: isLoadingAppointments, error: errorAppointmentsObj, execute: loadAppointments } = useApi(appointmentService.getUpcomingAppointments);
  const proximasConsultas = proximasConsultasList || [];
  const errorAppointments = !!errorAppointmentsObj;

  const { isLoading: isLoadingEvents, error: errorEventsObj, execute: loadInitialEvents } = useApi(async () => {
    const response: any = await dashboardService.getSystemEvents(1, 5);
    setActividadReciente(response.events);
    setHasMoreEvents(response.hasMore);
    setActivityPage(1);
  });
  const errorEvents = !!errorEventsObj;

  const { isLoading: isLoadingMore, error: errorMoreEventsObj, execute: handleLoadMoreActivity } = useApi(async () => {
    const nextPage = activityPage + 1;
    const response: any = await dashboardService.getSystemEvents(nextPage, 5);
    setActividadReciente(prev => [...prev, ...response.events]);
    setHasMoreEvents(response.hasMore);
    setActivityPage(nextPage);
  });
  const errorMoreEvents = !!errorMoreEventsObj;

  // TODO: Conexión WebSocket / Server-Sent Events (SSE)
  // Aquí el frontend debe suscribirse a los eventos en vivo del Radar Epidemiológico y Alertas críticas.
  // Ej: ws.on("radarAlert", (alert) => { updateAlerts(alert) })

  useEffect(() => {
    loadKPIs();
    loadAppointments(undefined, todayFormatted);
    loadInitialEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [globalState, todayFormatted]);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#F8FAFC]" style={{ fontFamily: "Inter, sans-serif" }}>
      <Sidebar onNavigate={onNavigate} onSettingsClick={onSettings} onLogoutClick={onLogout} onProfileClick={onProfile} />

      <main className="flex-1 flex flex-col overflow-y-auto">
        <header className="flex items-center justify-between px-8 py-6 bg-white border-b border-slate-100 sticky top-0 z-10">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Panel Principal</h1>
            <p className="text-sm font-medium text-slate-400 mt-1">{dynamicDateText}</p>
          </div>
          <div className="flex items-center gap-4">
            <NotificationBell globalState={globalState} />
            <div className="w-px h-6 bg-slate-200 hidden md:block"></div>
            <button onClick={() => onNavigate("agenda")} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-white border-[1.5px] border-slate-200 text-slate-600 hover:bg-slate-50 transition-all shadow-sm">
              <CalendarIcon size={16} /> Ver Agenda Completa
            </button>
          </div>
        </header>

        <div className="p-8 space-y-6 max-w-7xl mx-auto w-full">
          
          {/* MÓDULO 1: KPIs REACTIVOS A LA BD MAESTRA */}
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {errorKPIs ? (
               <div className="md:col-span-2 lg:col-span-4 bg-rose-50/40 border border-rose-100 rounded-2xl p-8 flex flex-col items-center justify-center text-center shadow-sm">
                 <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center mb-3">
                   <WifiOff size={24} className="text-rose-500" />
                 </div>
                 <h3 className="text-base font-bold text-slate-800">Conexión a métricas perdida</h3>
                 <p className="text-sm text-slate-500 mt-1 mb-5">No pudimos cargar los indicadores principales del sistema.</p>
                 <button onClick={loadKPIs} className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 hover:text-slate-900 shadow-sm transition-all group">
                   <RefreshCw size={16} className="text-slate-400 group-hover:rotate-180 transition-transform duration-500" /> Reintentar conexión
                 </button>
               </div>
            ) : isLoadingKPIs ? (
              [1, 2, 3, 4].map(i => (
                <div key={i} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm transition-all">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-xl bg-slate-200 animate-pulse"></div>
                    <div className="w-16 h-5 rounded-full bg-slate-200 animate-pulse"></div>
                  </div>
                  <div>
                    <div className="w-12 h-8 bg-slate-200 rounded animate-pulse mb-2"></div>
                    <div className="w-24 h-3 bg-slate-200 rounded animate-pulse"></div>
                  </div>
                </div>
              ))
            ) : (
              [
                { id: 1, title: "Atendidos Hoy", value: kpiData?.pacientesAtendidosHoy || 0, trend: "+2 desde ayer", icon: Users, pos: true },
                { id: 2, title: "Casos Críticos", value: kpiData?.casosCriticos || 0, trend: "Estable", icon: Activity, pos: true },
                { id: 3, title: "Interconsultas", value: kpiData?.interconsultas || 0, trend: "Trabajo en equipo", icon: Share2, pos: true },
                { id: 4, title: "Reportes Generados", value: kpiData?.reportsCount || 0, trend: "Descargas PDF", icon: FileText, pos: true },
              ].map((kpi) => {
                const Icon = kpi.icon;
                return (
                  <div key={kpi.id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow group">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-10 h-10 rounded-xl bg-cyan-50 flex items-center justify-center text-[#0E7490] group-hover:scale-110 transition-transform">
                        <Icon size={20} strokeWidth={2.5} />
                      </div>
                      <div className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${kpi.pos ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
                        {kpi.pos ? <TrendingUp size={12} strokeWidth={3} /> : <TrendingDown size={12} strokeWidth={3} />}
                        <span>{kpi.trend}</span>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-3xl font-bold text-slate-900 mb-1">{kpi.value}</h3>
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{kpi.title}</p>
                    </div>
                  </div>
                );
              })
            )}
          </section>

          {/* FILA CENTRAL (RADAR Y AGENDA) */}
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* RADAR EPIDEMIOLÓGICO */}
            <div className="lg:col-span-2 flex flex-col h-full">
              <div className="bg-gradient-to-br from-red-50/50 to-amber-50/30 rounded-2xl border border-red-100 shadow-sm p-6 flex-1 flex flex-col">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center text-red-600 shadow-inner"><ShieldAlert size={20} strokeWidth={2.5} /></div>
                    <div><h2 className="text-lg font-bold text-slate-900">Radar Epidemiológico</h2><p className="text-xs font-medium text-red-500 uppercase tracking-wider mt-0.5">Algoritmo predictivo de CliniData activo</p></div>
                  </div>
                </div>
                
                <div className="space-y-4 flex-1">
                  {errorKPIs ? (
                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 flex items-center gap-3">
                      <ShieldAlert size={18} className="text-slate-400" />
                      <p className="text-sm font-bold text-slate-500">Radar epidemiológico desconectado (Fallo de telemetría)</p>
                    </div>
                  ) : isLoadingKPIs ? (
                    <div className="bg-white/60 rounded-xl p-4 border border-red-50 flex items-start gap-4">
                      <div className="w-5 h-5 rounded bg-slate-200 animate-pulse mt-1 shrink-0"></div>
                      <div className="flex-1">
                        <div className="w-1/3 h-4 bg-slate-200 rounded animate-pulse mb-2"></div>
                        <div className="w-full h-3 bg-slate-200 rounded animate-pulse mb-1"></div>
                        <div className="w-2/3 h-3 bg-slate-200 rounded animate-pulse"></div>
                      </div>
                    </div>
                  ) : kpiData?.alertasEpidemiologicas?.length === 0 ? (
                    <div className="bg-white/60 rounded-xl p-4 border border-emerald-100 text-emerald-700 font-bold text-sm">
                      ✅ No hay patrones anómalos de morbilidad detectados hoy en tu clínica.
                    </div>
                  ) : (
                    kpiData?.alertasEpidemiologicas?.map((alert: any) => (
                      <div key={alert.id} className="bg-white rounded-xl p-4 border border-red-50 shadow-sm flex items-start gap-4 transition-transform hover:-translate-y-0.5">
                        <div className="mt-1"><AlertTriangle size={18} className={alert.severity === "high" ? "text-red-500" : "text-amber-500"} /></div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1"><h4 className="text-sm font-bold text-slate-900">{alert.title}</h4><span className="text-[10px] font-bold text-slate-400">{alert.date}</span></div>
                          <p className="text-xs text-slate-600 leading-relaxed font-medium">{alert.description}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* AGENDA RÁPIDA */}
            <div className="lg:col-span-1 bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col h-full">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2"><Clock size={18} className="text-[#0E7490]" /><h2 className="text-lg font-bold text-slate-900">Próximas Consultas</h2></div>
                <span className="px-2.5 py-0.5 bg-cyan-50 text-[#0E7490] text-xs font-bold rounded-md">Hoy</span>
              </div>
              <div className="flex flex-col gap-3 flex-1">
                {errorAppointments ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-rose-50/40 rounded-2xl border border-rose-100">
                    <WifiOff size={24} className="text-rose-400 mb-3" />
                    <p className="text-sm font-bold text-slate-800">Error de sincronización</p>
                    <p className="text-xs text-slate-500 mt-1 mb-4">No pudimos acceder a la agenda del día.</p>
                    <button onClick={loadAppointments} className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 shadow-sm transition-all group"><RefreshCw size={14} className="group-hover:rotate-180 transition-transform duration-500" /> Reintentar</button>
                  </div>
                ) : isLoadingAppointments ? (
                  [1,2,3].map(i => (
                    <div key={i} className="flex items-center justify-between p-3.5 rounded-xl border border-slate-100 bg-slate-50/50">
                      <div className="space-y-2 flex-1 pr-4">
                        <div className="w-16 h-3 bg-slate-200 rounded animate-pulse"></div>
                        <div className="w-24 h-4 bg-slate-200 rounded animate-pulse"></div>
                        <div className="w-16 h-4 bg-slate-200 rounded animate-pulse mt-1"></div>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-slate-200 animate-pulse shrink-0"></div>
                    </div>
                  ))
                ) : proximasConsultas.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-4"><p className="text-sm text-slate-500 font-medium">No hay consultas en la agenda global.</p></div>
                ) : (
                  proximasConsultas.map((app: any) => {
                    const config = typeConfig[app.type] || typeConfig.rutina;
                    return (
                      <div key={app.id} className="flex items-center justify-between p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors group">
                        <div>
                          <p className="text-xs font-bold text-[#0E7490] mb-0.5">{app.time}</p>
                          <p className="text-sm font-bold text-slate-900 mb-1.5">{app.patientName}</p>
                          <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md ${config.bg} ${config.text}`}>{config.label}</span>
                        </div>
                        <button onClick={() => onNavigate("agenda")} className="w-10 h-10 rounded-full bg-white border border-slate-200 text-[#0E7490] flex items-center justify-center shadow-sm hover:bg-[#0E7490] hover:text-white transition-all group-hover:scale-105"><PlayCircle size={18} className="ml-0.5" /></button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </section>

          {/* LÍNEA DE TIEMPO / EVENTOS GLOBALES */}
          <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-8"><Activity size={18} className="text-[#0E7490]" /><h2 className="text-lg font-bold text-slate-900">Actividad Reciente del Sistema</h2></div>
            <div className="relative pl-4 sm:pl-0">
              <div className="absolute left-[27px] sm:left-[23px] top-2 bottom-2 w-px bg-slate-100"></div>
              <div className="flex flex-col gap-6">
                {errorEvents ? (
                  <div className="bg-rose-50/40 rounded-2xl p-6 border border-rose-100 shadow-sm flex flex-col items-center justify-center text-center mx-4 sm:mx-0 z-10">
                    <WifiOff size={24} className="text-rose-400 mb-2" />
                    <p className="text-sm font-bold text-slate-800">Servicio de historiales inalcanzable</p>
                    <button onClick={loadInitialEvents} className="mt-3 flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 shadow-sm transition-all group"><RefreshCw size={14} className="group-hover:rotate-180 transition-transform duration-500" /> Reintentar</button>
                  </div>
                ) : isLoadingEvents ? (
                  [1,2,3].map(i => (
                    <div key={i} className="relative flex items-start gap-4">
                      <div className="w-12 h-12 sm:w-12 sm:h-12 rounded-full bg-slate-200 animate-pulse shrink-0 ring-4 ring-white relative z-10 text-transparent"></div>
                      <div className="flex-1 pt-1.5 pb-2">
                        <div className="w-3/4 h-4 bg-slate-200 rounded animate-pulse mb-2"></div>
                        <div className="w-1/4 h-3 bg-slate-200 rounded animate-pulse"></div>
                      </div>
                    </div>
                  ))
                ) : (
                  actividadReciente.map((activity: any) => {
                    let ActIcon = Edit3; let iconBg = "bg-blue-50 text-[#0B5394] ring-white";
                    if (activity.type === "prescription") { ActIcon = Pill; iconBg = "bg-emerald-50 text-emerald-600 ring-white"; } 
                    else if (activity.type === "assignment") { ActIcon = UserPlus; iconBg = "bg-amber-50 text-amber-600 ring-white"; }
                    
                    return (
                      <div key={activity.id} className="relative flex items-start gap-4 group">
                        <div className={`w-12 h-12 sm:w-12 sm:h-12 rounded-full flex items-center justify-center shrink-0 ring-4 relative z-10 transition-transform group-hover:scale-110 ${iconBg}`}><ActIcon size={18} strokeWidth={2.5} /></div>
                        <div className="flex-1 pt-1.5 pb-2 bg-white rounded-xl">
                          <p className="text-sm font-medium text-slate-600">
                            <strong className="text-slate-900">{activity.doctorName}</strong> {activity.action}{" "}
                            {activity.patientId ? (
                              <strong 
                                className="text-[#0E7490] cursor-pointer hover:underline"
                                onClick={() => {
                                  const p = globalState.patients.find((p: any) => p.id === activity.patientId);
                                  if (p) {
                                    let focusSection = "profile";
                                    if (activity.type === "prescription") focusSection = "prescriptions";
                                    else if (activity.type === "assignment") focusSection = "team";
                                    else if (activity.type === "update") focusSection = "profile";
                                    globalState.handlePatientSelect(p, focusSection);
                                  } else {
                                    setToastMessage("Obteniendo expediente del servidor...");
                                    setTimeout(() => setToastMessage(null), 3000);
                                  }
                                }}
                              >
                                {activity.patientName}
                              </strong>
                            ) : (
                              <strong className="text-slate-900">{activity.patientName}</strong>
                            )}.
                          </p>
                          <p className="text-xs font-bold text-slate-400 mt-1">{activity.timeAgo}</p>
                        </div>
                      </div>
                    );
                  })
                )}
                
                {(!isLoadingEvents && !errorEvents && hasMoreEvents) && (
                  <div className="pt-6 mt-2 border-t border-slate-100 flex justify-center z-10 bg-white">
                    <button 
                      onClick={handleLoadMoreActivity}
                      disabled={isLoadingMore}
                      className={`px-5 py-2.5 rounded-xl text-sm font-bold border-[1.5px] transition-all flex items-center justify-center ${errorMoreEvents ? 'border-rose-200 text-rose-600 hover:bg-rose-50 bg-rose-50/50 shadow-sm' : isLoadingMore ? 'border-slate-200 text-slate-600 opacity-70 cursor-not-allowed' : 'border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 shadow-sm'}`}
                    >
                      {isLoadingMore ? (
                        <span className="flex items-center gap-2"><Loader2 size={16} className="animate-spin text-[#0E7490]" /> Cargando historial...</span>
                      ) : errorMoreEvents ? (
                        <span className="flex items-center gap-2"><RefreshCw size={16} /> Fallo al cargar. Reintentar conexión</span>
                      ) : (
                        "Cargar historial anterior"
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </section>

        </div>
      </main>

      {/* TOAST NOTIFICATION */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 lg:bottom-10 lg:right-10 bg-slate-900 border border-slate-800 text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
          <Loader2 size={18} className="animate-spin text-cyan-400" />
          <span className="text-sm font-bold tracking-wide">{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
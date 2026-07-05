import React, { useState, useEffect } from "react";
import { 
  Users, Activity, Share2, FileText, TrendingUp, TrendingDown, 
  AlertTriangle, Clock, Calendar as CalendarIcon, Loader2,
  WifiOff, RefreshCw, Shield, Stethoscope, ArrowRight, UserPlus
} from "lucide-react";
import { Sidebar } from "./components/Sidebar";
import { NotificationBell } from "./components/NotificationBell";
import { useApi } from "./hooks/useApi";
import { dashboardService } from "./services/dashboardService";
import { appointmentService } from "./services/appointmentService";
import { useAuth } from "./context/AuthContext";
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area, PieChart, Pie, Cell, Legend 
} from "recharts";

const typeConfig: Record<string, any> = {
  rutina: { label: "Rutina", bg: "bg-blue-50", text: "text-[#0B5394]" },
  control: { label: "Control", bg: "bg-emerald-50", text: "text-emerald-700" },
  urgencia: { label: "Urgencia", bg: "bg-rose-50", text: "text-rose-700" },
  especialista: { label: "Especialista", bg: "bg-purple-50", text: "text-purple-700" }
};

const COLORS = ['#0B5394', '#0E7490', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

export function Dashboard({ globalState, onNavigate, onLogout, onSettings, onProfile }: any) {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  // --- FECHA DINÁMICA ---
  const today = new Date();
  const dynamicDateText = today.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).replace(/^\w/, (c) => c.toUpperCase());
  const todayFormatted = `${today.getDate()} ${["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"][today.getMonth()]}, ${today.getFullYear()}`;

  const { data: kpiData, isLoading: isLoadingKPIs, error: errorKPIsObj, execute: loadKPIs } = useApi(dashboardService.getKPIs);
  const errorKPIs = !!errorKPIsObj;

  const { data: proximasConsultasList, isLoading: isLoadingAppointments, execute: loadAppointments } = useApi(appointmentService.getUpcomingAppointments);
  const proximasConsultas = proximasConsultasList || [];

  const { data: eventsData, isLoading: isLoadingEvents, execute: loadInitialEvents } = useApi(async () => await dashboardService.getSystemEvents(1, 10));
  const actividadReciente = eventsData?.events || [];

  useEffect(() => {
    loadKPIs();
    if (!isAdmin) {
      loadAppointments(undefined, todayFormatted);
    }
    loadInitialEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [globalState, todayFormatted, isAdmin]);

  // Funciones de renderizado para Admin
  const renderAdminKPIs = () => {
    const kpis = kpiData?.kpis || {};
    const cards = [
      { id: 1, title: "Consultas del Mes", value: kpis.consultasMes || 0, trend: `${(kpis.consultasMes || 0) > (kpis.consultasMesAnterior || 0) ? '+' : ''}${(kpis.consultasMes || 0) - (kpis.consultasMesAnterior || 0)} vs. mes ant.`, icon: FileText, pos: (kpis.consultasMes || 0) >= (kpis.consultasMesAnterior || 0) },
      { id: 2, title: "Tasa Inasistencia", value: `${kpis.tasaInasistencia || 0}%`, trend: "Impacto operativo", icon: AlertTriangle, pos: (kpis.tasaInasistencia || 0) < 15 },
      { id: 3, title: "Pacientes Nuevos", value: kpis.pacientesNuevos || 0, trend: "Crecimiento de clínica", icon: UserPlus, pos: true },
      { id: 4, title: "Espera Promedio", value: `${kpis.tiempoEsperaPromedio || 0}m`, trend: "En sala de espera", icon: Clock, pos: (kpis.tiempoEsperaPromedio || 0) <= 20 },
    ];

    return (
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {cards.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow group">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-cyan-50 flex items-center justify-center text-[#0E7490] group-hover:scale-110 transition-transform">
                  <Icon size={20} strokeWidth={2.5} />
                </div>
                <div className={`flex items-center gap-1 text-[10px] sm:text-xs font-bold px-2 py-1 rounded-full ${kpi.pos ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
                  {kpi.pos ? <TrendingUp size={12} strokeWidth={3} /> : <TrendingDown size={12} strokeWidth={3} />}
                  <span>{kpi.trend}</span>
                </div>
              </div>
              <div>
                <h3 className="text-3xl font-bold text-slate-900 mb-1">{kpi.value}</h3>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{kpi.title}</p>
              </div>
            </div>
          );
        })}
      </section>
    );
  };

  const renderAdminCharts = () => (
    <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2"><Activity size={18} className="text-[#0E7490]"/> Flujo de Pacientes Reciente</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={kpiData?.flujoConsultas || []}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis dataKey="fecha" axisLine={false} tickLine={false} tick={{fill: '#64748B', fontSize: 12}} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748B', fontSize: 12}} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
              <Line type="monotone" dataKey="cantidad" stroke="#0B5394" strokeWidth={3} dot={{r: 4, fill: '#0B5394', strokeWidth: 2, stroke: '#fff'}} activeDot={{r: 6}} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2"><Stethoscope size={18} className="text-[#0E7490]"/> Consultas por Médico</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={kpiData?.cargaTrabajoMedicos || []} layout="vertical" margin={{ left: 30 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
              <XAxis type="number" axisLine={false} tickLine={false} tick={{fill: '#64748B', fontSize: 12}} />
              <YAxis dataKey="medico" type="category" axisLine={false} tickLine={false} tick={{fill: '#475569', fontSize: 11, fontWeight: 600}} width={100} />
              <Tooltip cursor={{fill: '#F8FAFC'}} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
              <Bar dataKey="consultas" fill="#0E7490" radius={[0, 4, 4, 0]} barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  );

  // Funciones de renderizado para Médico
  const renderMedicoKPIs = () => {
    const kpis = kpiData?.kpis || {};
    const cards = [
      { id: 1, title: "Mis Consultas Hoy", value: `${kpis.atendidasHoy || 0}/${kpis.programadasHoy || 0}`, trend: "Progreso diario", icon: Users, pos: true },
      { id: 2, title: "En Observación / Críticos", value: kpis.pacientesSeveros || 0, trend: "Requieren atención", icon: AlertTriangle, pos: (kpis.pacientesSeveros || 0) === 0 },
      { id: 3, title: "Interconsultas", value: kpis.interconsultas || 0, trend: "Casos compartidos", icon: Share2, pos: true },
      { id: 4, title: "Tiempo Promedio Consulta", value: `${kpis.tiempoPromedioConsulta || 0}m`, trend: "Eficiencia clínica", icon: Clock, pos: true },
    ];

    return (
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {cards.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow group">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-cyan-50 flex items-center justify-center text-[#0E7490] group-hover:scale-110 transition-transform">
                  <Icon size={20} strokeWidth={2.5} />
                </div>
                <div className={`flex items-center gap-1 text-[10px] sm:text-xs font-bold px-2 py-1 rounded-full ${kpi.pos ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
                  {kpi.pos ? <TrendingUp size={12} strokeWidth={3} /> : <TrendingDown size={12} strokeWidth={3} />}
                  <span>{kpi.trend}</span>
                </div>
              </div>
              <div>
                <h3 className="text-3xl font-bold text-slate-900 mb-1">{kpi.value}</h3>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{kpi.title}</p>
              </div>
            </div>
          );
        })}
      </section>
    );
  };

  const renderMedicoCharts = () => (
    <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
      {/* Diagnósticos Frecuentes (Dona) */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2"><Activity size={18} className="text-[#0E7490]"/> Top Diagnósticos</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={kpiData?.diagnosticosFrecuentes || []} dataKey="cantidad" nameKey="descripcion" cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5}>
                {(kpiData?.diagnosticosFrecuentes || []).map((_: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
              <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{fontSize: '11px', fontWeight: 500, color: '#475569'}} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tendencias Consultas (Área) */}
      <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2"><TrendingUp size={18} className="text-[#0E7490]"/> Evolución de mis Consultas</h3>
          <span className="px-2.5 py-1 bg-slate-50 text-slate-500 rounded-md text-[10px] font-bold uppercase tracking-wider border border-slate-200">Últimos 30 días</span>
        </div>
        <div className="flex-1 min-h-[256px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={kpiData?.tendenciasConsultas || []}>
              <defs>
                <linearGradient id="colorConsultas" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0B5394" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#0B5394" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis dataKey="fecha" axisLine={false} tickLine={false} tick={{fill: '#64748B', fontSize: 12}} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748B', fontSize: 12}} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
              <Area type="monotone" dataKey="cantidad" stroke="#0B5394" strokeWidth={3} fillOpacity={1} fill="url(#colorConsultas)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  );

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#F8FAFC]" style={{ fontFamily: "Inter, sans-serif" }}>
      <Sidebar onNavigate={onNavigate} onSettingsClick={onSettings} onLogoutClick={onLogout} onProfileClick={onProfile} />

      <main className="flex-1 flex flex-col overflow-y-auto">
        <header className="flex items-center justify-between px-8 py-6 bg-white border-b border-slate-100 sticky top-0 z-20">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Panel {isAdmin ? "Administrativo" : "Clínico"}</h1>
            <p className="text-sm font-medium text-slate-400 mt-1">{dynamicDateText}</p>
          </div>
          <div className="flex items-center gap-4">
            <NotificationBell globalState={globalState} />
            {!isAdmin && (
              <>
                <div className="w-px h-6 bg-slate-200 hidden md:block"></div>
                <button onClick={() => onNavigate("agenda")} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-white border-[1.5px] border-slate-200 text-slate-600 hover:bg-slate-50 transition-all shadow-sm">
                  <CalendarIcon size={16} /> Ir a Agenda
                </button>
              </>
            )}
          </div>
        </header>

        <div className="p-8 space-y-6 max-w-7xl mx-auto w-full">
          {errorKPIs ? (
            <div className="bg-rose-50/40 border border-rose-100 rounded-2xl p-8 flex flex-col items-center justify-center text-center shadow-sm">
              <WifiOff size={24} className="text-rose-500 mb-3" />
              <h3 className="text-base font-bold text-slate-800">Conexión a métricas perdida</h3>
              <button onClick={loadKPIs} className="mt-4 flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 shadow-sm"><RefreshCw size={16} /> Reintentar conexión</button>
            </div>
          ) : isLoadingKPIs ? (
            <div className="flex items-center justify-center py-20"><Loader2 size={32} className="text-[#0E7490] animate-spin" /></div>
          ) : (
            <>
              {isAdmin ? renderAdminKPIs() : renderMedicoKPIs()}
              {isAdmin ? renderAdminCharts() : renderMedicoCharts()}
              
              {/* PANEELES INFERIORES */}
              <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
                
                {/* LISTADO RÁPIDO DEPENDIENTE DEL ROL */}
                <div className="lg:col-span-1 bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col h-full max-h-[400px] overflow-hidden">
                  <div className="flex items-center justify-between mb-5">
                    <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      {isAdmin ? <Shield size={18} className="text-[#0E7490]" /> : <Clock size={18} className="text-[#0E7490]" />}
                      {isAdmin ? "Auditorías de Seguridad" : "Próximas Consultas"}
                    </h2>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto pr-2 flex flex-col gap-3">
                    {isAdmin ? (
                      kpiData?.auditoriasRecientes?.length > 0 ? kpiData.auditoriasRecientes.map((aud: any) => (
                        <div key={aud.id} className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-sm">
                          <p className="font-bold text-slate-800 text-xs mb-1">{aud.usuario}</p>
                          <p className="text-slate-600 text-[11px] leading-tight">{aud.accion}: {aud.detalles}</p>
                        </div>
                      )) : <p className="text-sm text-slate-500 text-center mt-10">No hay auditorías recientes.</p>
                    ) : (
                      isLoadingAppointments ? <Loader2 size={20} className="animate-spin mx-auto text-[#0E7490] mt-10" /> :
                      proximasConsultas.length > 0 ? proximasConsultas.map((app: any) => {
                        const config = typeConfig[app.type] || typeConfig.rutina;
                        return (
                          <div key={app.id} className="flex items-center justify-between p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors group">
                            <div>
                              <p className="text-[10px] font-bold text-[#0E7490] mb-0.5">{app.time}</p>
                              <p className="text-xs font-bold text-slate-900 mb-1">{app.patientName}</p>
                              <span className={`px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded-md ${config.bg} ${config.text}`}>{config.label}</span>
                            </div>
                            <button onClick={() => onNavigate("agenda")} className="w-8 h-8 rounded-full bg-white border border-slate-200 text-[#0E7490] flex items-center justify-center hover:bg-[#0E7490] hover:text-white transition-all"><ArrowRight size={14} /></button>
                          </div>
                        )
                      }) : <p className="text-sm text-slate-500 text-center mt-10">Agenda libre por hoy.</p>
                    )}
                  </div>
                </div>

                {/* FEED DE EVENTOS GLOBALES */}
                <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col h-full max-h-[400px]">
                  <div className="flex items-center justify-between mb-5">
                    <h2 className="text-base font-bold text-slate-900 flex items-center gap-2"><Activity size={18} className="text-[#0E7490]" /> Actividad Reciente del Sistema</h2>
                  </div>
                  <div className="flex-1 overflow-y-auto pr-2 relative">
                    <div className="absolute left-[15px] top-2 bottom-2 w-px bg-slate-100"></div>
                    <div className="flex flex-col gap-4">
                      {isLoadingEvents ? <Loader2 size={20} className="animate-spin mx-auto text-[#0E7490] mt-10" /> : 
                      actividadReciente.length > 0 ? actividadReciente.map((activity: any) => (
                        <div key={activity.id} className="relative flex items-start gap-3">
                          <div className="w-8 h-8 rounded-full bg-cyan-50 text-[#0E7490] ring-4 ring-white relative z-10 flex items-center justify-center shrink-0"><Activity size={14} /></div>
                          <div className="flex-1 pt-1 bg-white rounded-xl">
                            <p className="text-[13px] font-medium text-slate-600 leading-snug">
                              <strong className="text-slate-900">{activity.doctorName}</strong> {activity.action} <strong className="text-[#0E7490]">{activity.patientName}</strong>
                            </p>
                            <p className="text-[10px] font-bold text-slate-400 mt-1">{activity.timeAgo}</p>
                          </div>
                        </div>
                      )) : <p className="text-sm text-slate-500 text-center mt-10">Sin actividad reciente.</p>}
                    </div>
                  </div>
                </div>

              </section>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
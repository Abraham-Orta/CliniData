import React, { useEffect } from "react";
import { Sidebar } from "./components/Sidebar";
import { NotificationBell } from "./components/NotificationBell";
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend, BarChart, Bar, CartesianGrid
} from "recharts";
import { useApi } from "./hooks/useApi";
import { reportsService } from "./services/reportsService";
import { Download, Loader2, Users, AlertTriangle, CheckCircle, TrendingUp, Clock, Activity, BedDouble, ShieldCheck } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export function Reports({ globalState, onNavigate, onLogout, onSettings, onProfile }: any) {
  const { data: globalStats, isLoading: loadingStats, error: errorStats, execute: loadStats } = useApi(reportsService.getGlobalStats);
  const { data: demographics, isLoading: loadingDemographics, execute: loadDemographics } = useApi(reportsService.getDemographics);
  const { data: trends, isLoading: loadingTrends, execute: loadTrends } = useApi(reportsService.getAppointmentsTrends);
  const { data: advancedMetrics, isLoading: loadingAdvanced, execute: loadAdvanced } = useApi(reportsService.getAdvancedMetrics);
  const { data: topConditions, isLoading: loadingConditions, execute: loadConditions } = useApi(reportsService.getTopConditions);

  useEffect(() => {
    loadStats();
    loadDemographics();
    loadTrends();
    loadAdvanced();
    loadConditions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleExportEPI12 = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Ministerio del Poder Popular para la Salud", 14, 20);
    doc.setFontSize(14);
    doc.text("Formato SIS-04 / EPI-12 - Consolidado Semanal de Enfermedades de Notificación Obligatoria", 14, 30);
    
    // Simular exportación EPI-12
    const data = topConditions?.slice(0, 5).map((c: any) => [c.name, c.count.toString(), "Sospechoso"]) || [];
    autoTable(doc, {
      startY: 40,
      head: [["Enfermedad (CIE-10)", "N° Casos", "Clasificación"]],
      body: data,
      theme: "grid"
    });
    doc.save(`EPI-12_Semana_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const handleExportEPI15 = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Ministerio del Poder Popular para la Salud", 14, 20);
    doc.setFontSize(14);
    doc.text("Formato SIS-04 / EPI-15 - Consolidado Mensual de Morbilidad General", 14, 30);
    
    // Simular exportación EPI-15
    const data = topConditions?.map((c: any) => [c.name, c.count.toString()]) || [];
    autoTable(doc, {
      startY: 40,
      head: [["Causa de Consulta", "Total Casos Atendidos"]],
      body: data,
      theme: "grid"
    });
    doc.save(`EPI-15_Mensual_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const isLoading = loadingStats || loadingDemographics || loadingTrends || loadingAdvanced || loadingConditions;

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#F8FAFC]">
      <Sidebar onNavigate={onNavigate} onSettingsClick={onSettings} onLogoutClick={onLogout} onProfileClick={onProfile} />

      <main className="flex-1 flex flex-col h-screen overflow-y-auto">
        {/* HEADER */}
        <header className="flex items-center justify-between px-10 py-8 bg-white border-b border-slate-200 shrink-0">
          <div>
            <h1 className="text-3xl font-extrabold text-[#0B5394] tracking-tight">Centro de Inteligencia Clínica</h1>
            <p className="text-sm font-medium text-slate-500 mt-1">Monitoreo avanzado y predicción operativa general.</p>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={handleExportEPI12}
              disabled={isLoading}
              className="flex items-center gap-2 px-5 py-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl font-bold shadow-sm hover:bg-rose-100 transition-all disabled:opacity-50"
            >
              <Download size={18} />
              Generar EPI-12 Semanal
            </button>
            <button 
              onClick={handleExportEPI15}
              disabled={isLoading}
              className="flex items-center gap-2 px-5 py-2.5 bg-cyan-50 border border-cyan-200 text-cyan-700 rounded-xl font-bold shadow-sm hover:bg-cyan-100 transition-all disabled:opacity-50"
            >
              <Download size={18} />
              Generar EPI-15 Mensual
            </button>
            <div className="w-px h-8 bg-slate-200 mx-2"></div>
            <NotificationBell globalState={globalState} />
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#0B5394] to-[#0E7490] flex items-center justify-center text-white font-bold shadow-md cursor-pointer hover:shadow-lg transition-transform hover:-translate-y-0.5" onClick={onProfile}>
              DR
            </div>
          </div>
        </header>

        {/* CONTENT */}
        <div className="p-10 max-w-7xl mx-auto w-full space-y-8">
          {errorStats ? (
            <div className="p-4 bg-red-50 text-red-600 rounded-xl font-medium border border-red-100 flex items-center gap-2">
              <AlertTriangle size={20} /> Error cargando los datos.
            </div>
          ) : null}

          {/* KPI BENTO GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
              <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                <Users size={48} className="text-[#0B5394]" />
              </div>
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Total Pacientes</h3>
              <div className="text-4xl font-extrabold text-slate-900">
                {loadingStats ? <Loader2 className="animate-spin text-slate-400" size={32} /> : globalStats?.totalPatients || 0}
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
              <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                <AlertTriangle size={48} className="text-amber-500" />
              </div>
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Tasa Ausentismo (No-shows)</h3>
              <div className="text-4xl font-extrabold text-slate-900">
                {loadingAdvanced ? <Loader2 className="animate-spin text-slate-400" size={32} /> : `${advancedMetrics?.noShowRate || 0}%`}
              </div>
              <p className="text-xs text-slate-400 mt-2">Pacientes que no asisten a cita</p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
              <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                <Clock size={48} className="text-[#0E7490]" />
              </div>
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Prm. Espera (min)</h3>
              <div className="text-4xl font-extrabold text-slate-900">
                {loadingAdvanced ? <Loader2 className="animate-spin text-slate-400" size={32} /> : advancedMetrics?.averageWaitTime || 0}
              </div>
              <p className="text-xs text-slate-400 mt-2">Desde llegada a consulta médica</p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
              <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                <TrendingUp size={48} className="text-emerald-500" />
              </div>
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Ratio Finalización</h3>
              <div className="text-4xl font-extrabold text-slate-900">
                {loadingAdvanced ? <Loader2 className="animate-spin text-slate-400" size={32} /> : `${advancedMetrics?.completedRate || 0}%`}
              </div>
              <p className="text-xs text-slate-400 mt-2">Citas concretadas con éxito</p>
            </div>
          </div>

          {/* CHARTS GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-20">
            {/* AREA CHART - TENDENCIAS */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col h-[400px]">
              <div className="mb-6">
                <h2 className="text-lg font-bold text-slate-900">Evolución de Consultas y Atendidos</h2>
                <p className="text-sm text-slate-500">Volumen histórico de los últimos 6 meses</p>
              </div>
              <div className="flex-1 w-full min-h-0">
                {loadingTrends ? (
                  <div className="w-full h-full flex justify-center items-center"><Loader2 className="animate-spin text-slate-300" size={40} /></div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trends || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorConsultas" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#0E7490" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#0E7490" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 12 }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 12 }} />
                      <RechartsTooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}
                      />
                      <Area type="monotone" name="Total Agendado" dataKey="consultas" stroke="#0E7490" strokeWidth={3} fillOpacity={1} fill="url(#colorConsultas)" activeDot={{ r: 6, strokeWidth: 0, fill: '#0E7490' }} />
                      <Area type="monotone" name="Pacientes Atendidos" dataKey="atendidos" stroke="#94A3B8" strokeWidth={2} fillOpacity={0} strokeDasharray="5 5" />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* DOUGHNUT CHART - DEMOGRAFIA CLÍNICA */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col h-[400px]">
              <div className="mb-6">
                <h2 className="text-lg font-bold text-slate-900">Distribución de Estados Clínicos</h2>
                <p className="text-sm text-slate-500">Proporción de pacientes activos por estado</p>
              </div>
              <div className="flex-1 w-full min-h-0 flex items-center justify-center">
                {loadingDemographics ? (
                  <div className="w-full h-full flex justify-center items-center"><Loader2 className="animate-spin text-slate-300" size={40} /></div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={demographics?.statusDistribution || []}
                        cx="50%"
                        cy="50%"
                        innerRadius={80}
                        outerRadius={110}
                        paddingAngle={5}
                        dataKey="value"
                        stroke="none"
                      >
                        {(demographics?.statusDistribution || []).map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <RechartsTooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}
                        itemStyle={{ color: '#0F172A', fontWeight: 'bold' }}
                      />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" iconSize={10} wrapperStyle={{ fontSize: '13px', paddingTop: '20px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* BAR CHART - TOP CONDITIONS */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col h-[400px] lg:col-span-2">
              <div className="mb-6">
                <h2 className="text-lg font-bold text-slate-900">Prevalencia de Diagnósticos (Top 5)</h2>
                <p className="text-sm text-slate-500">Condiciones más recurrentes en el trimestre actual</p>
              </div>
              <div className="flex-1 w-full min-h-0">
                {loadingConditions ? (
                  <div className="w-full h-full flex justify-center items-center"><Loader2 className="animate-spin text-slate-300" size={40} /></div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topConditions || []} margin={{ top: 10, right: 10, left: 20, bottom: 0 }} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#E2E8F0" />
                      <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 12 }} />
                      <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 13, fontWeight: 500 }} width={160} />
                      <RechartsTooltip 
                        cursor={{fill: '#F1F5F9'}}
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}
                      />
                      <Bar dataKey="count" fill="#0B5394" radius={[0, 4, 4, 0]} barSize={28} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

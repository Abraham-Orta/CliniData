import React, { useState, useEffect, useRef } from "react";
import { 
  Search, SlidersHorizontal, Plus, ChevronDown, AlertTriangle, 
  UserPlus, X, Bell, CheckCircle2, Info, Activity, Loader2, RefreshCcw
} from "lucide-react";
import { Sidebar } from "./components/Sidebar";
import { PatientCard, type Patient } from "./components/PatientCard";
import { useApi } from "./hooks/useApi";
import { useAuth } from "./context/AuthContext";
import { patientService } from "./services/patientService";

type TabType = "mis-pacientes" | "casos-compartidos";
type FilterType = "Todos" | "Estable" | "Observación" | "Crítico";

const statusOptions = [{ value: "estable", label: "Estable" }, { value: "observacion", label: "En Observación" }, { value: "critico", label: "Crítico" }];
const bloodOptions = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

import { NotificationBell } from "./components/NotificationBell";

// Recibimos globalState
export function PatientHub({ globalState, onPatientSelect, onNavigate, onLogout, onSettings, onProfile }: any) {
  const { user } = useAuth();
  // Desestructuramos la Base de Datos Maestra
  const { patients, setPatients, events, setEvents } = globalState;

  // --- FECHA DINÁMICA ---
  const today = new Date();
  const dynamicDateText = today.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).replace(/^\w/, (c) => c.toUpperCase());
  const monthsEs = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
  const todayFormatted = `${today.getDate()} ${monthsEs[today.getMonth()]}, ${today.getFullYear()}`;

  const [activeTab, setActiveTab] = useState<TabType>("mis-pacientes");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filter, setFilter] = useState<FilterType>("Todos");
  
  const [loadedPatients, setLoadedPatients] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [isBloodOpen, setIsBloodOpen] = useState(false);

  const [addView, setAddView] = useState<"form" | "confirm-cancel" | "success">("form");
  const [newName, setNewName] = useState("");
  const [newAge, setNewAge] = useState("");
  const [newCondition, setNewCondition] = useState("");
  const [newStatus, setNewStatus] = useState<"estable" | "observacion" | "critico">("estable");
  const [newPhone, setNewPhone] = useState("");
  const [newLocation, setNewLocation] = useState("");
  const [newBloodType, setNewBloodType] = useState("O+");
  const [newAllergies, setNewAllergies] = useState("");

  const { data: patientStats, execute: loadStats } = useApi(patientService.getPatientStats);

  const { isLoading, error: initialErrorObj, execute: executeLoad } = useApi(async () => {
    const res = await patientService.getPatients(debouncedSearch, filter, activeTab, 1);
    setLoadedPatients(res.patients);
    setPage(1);
    setHasMore(res.hasMore);
    setIsSearching(false);
  });
  const hasError = !!initialErrorObj;

  useEffect(() => {
    loadStats();
  }, [loadedPatients.length]); // Reload stats when patients change? Or just once+after submit



  const { isLoading: isLoadingMore, error: moreErrorObj, execute: executeLoadMore } = useApi(async () => {
    const currentPage = page + 1;
    const res = await patientService.getPatients(debouncedSearch, filter, activeTab, currentPage);
    setLoadedPatients(prev => [...prev, ...res.patients]);
    setPage(currentPage);
    setHasMore(res.hasMore);
  });

  const { isLoading: isSubmitting, error: submitErrorObj, execute: executeSubmit } = useApi(async (newPatientData: any) => {
    await patientService.createPatient(newPatientData);
    
    // 2. Disparar Evento para el Dashboard
    setEvents([{
      id: `ev-${Date.now()}`, type: "assignment", doctorName: user?.name || "Dr. Rachel Kim", action: "añadió un nuevo paciente:", patientName: newPatientData.name, timeAgo: "Justo ahora", read: true
    }, ...events]);

    setAddView("success");
    executeLoad();
  });

  useEffect(() => {
    if (isAddModalOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "unset";
    return () => { document.body.style.overflow = "unset"; };
  }, [isAddModalOpen]);

  useEffect(() => {
    if (addView === "success") {
      const timer = setTimeout(() => closeAddModal(), 2200);
      return () => clearTimeout(timer);
    }
  }, [addView]);

  // --- BUSQUEDA REALISTA DEBOUNCE ---
  useEffect(() => {
    setIsSearching(true);
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  // --- CARGA DE PACIENTES ---
  const loadPatients = (isLoadMore = false) => {
    if (isLoadMore) executeLoadMore();
    else executeLoad();
  };

  useEffect(() => {
    loadPatients(false);
  }, [debouncedSearch, filter, activeTab]);

  const handleAddPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newAge || !newCondition) return;
    
    const initials = newName.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();
    const colors = ["#0B5394", "#047857", "#7C3AED", "#B45309", "#BE185D"];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    const newPatientData = {
      name: newName, age: parseInt(newAge), lastVisit: todayFormatted, condition: newCondition, status: newStatus, initials, avatarColor: randomColor, phone: newPhone || "+58 (000) 000-0000", location: newLocation || "No especificada", bloodType: newBloodType, allergies: newAllergies || "Ninguna", teamCount: 1
    };
    
    executeSubmit(newPatientData);
  };

  const closeAddModal = () => {
    setIsAddModalOpen(false); setAddView("form"); setNewName(""); setNewAge(""); setNewCondition(""); setNewStatus("estable"); setNewPhone(""); setNewLocation(""); setNewBloodType("O+"); setNewAllergies(""); setIsStatusOpen(false); setIsBloodOpen(false);
  };

  const handleAddCancelClick = () => {
    if (newName || newAge || newCondition || newPhone || newLocation || newAllergies) setAddView("confirm-cancel");
    else closeAddModal();
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#F8FAFC]" style={{ fontFamily: "Inter, sans-serif" }}>
      <Sidebar onNavigate={onNavigate} onSettingsClick={onSettings} onLogoutClick={onLogout} onProfileClick={onProfile} />

      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* HEADER */}
        <div className="flex items-center justify-between px-8 py-4 bg-white border-b border-gray-100 z-10" style={{ boxShadow: "0 1px 0 rgba(0,0,0,0.04)" }}>
          <div>
            <h1 style={{ fontSize: "18px", fontWeight: 700, color: "#111827", letterSpacing: "-0.2px" }}>Directorio de Pacientes</h1>
            <p style={{ fontSize: "12.5px", fontWeight: 400, color: "#9ca3af", marginTop: "1px" }}>{dynamicDateText}</p>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 hidden md:flex mr-2">
              {[
                { label: "Total", value: patientStats?.total || 0, color: "#0B5394" },
                { label: "Estables", value: patientStats?.estables || 0, color: "#16A34A" },
                { label: "Críticos", value: patientStats?.criticos || 0, color: "#E11D48" },
              ].map((stat) => (
                <div key={stat.label} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: stat.color }} />
                  <span className="text-xs font-bold text-slate-700">{stat.value}</span>
                  <span className="text-xs text-slate-500">{stat.label}</span>
                </div>
              ))}
            </div>
            
            {/* PANEL DE NOTIFICACIONES */}
            <NotificationBell globalState={globalState} onPatientSelect={onPatientSelect} />

            <div className="w-px h-6 bg-slate-200 hidden md:block"></div>
            
            {/* BOTÓN PRIMARIO ESTILO LOGIN */}
            <button onClick={() => setIsAddModalOpen(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-bold shadow-[0_4px_14px_rgba(11,83,148,0.35)] hover:shadow-[0_6px_20px_rgba(11,83,148,0.45)] hover:-translate-y-0.5 bg-gradient-to-r from-[#0B5394] to-[#0E7490] transition-all duration-200">
              <Plus size={16} strokeWidth={2.5} /> Añadir Paciente
            </button>
          </div>
        </div>

        {/* CONTENIDO PRINCIPAL */}
        <div className="flex-1 overflow-y-auto px-8 py-6">
          <div className="flex items-center gap-0 mb-6 border-b border-slate-200">
            {[
              { key: "mis-pacientes" as TabType, label: "Mis Pacientes", count: patientStats?.misPacientes || 0 },
              { key: "casos-compartidos" as TabType, label: "Casos Compartidos", count: patientStats?.casosCompartidos || 0 },
            ].map((tab) => (
              <button key={tab.key} onClick={() => { setActiveTab(tab.key); setSearch(""); setFilter("Todos"); }} className="relative flex items-center gap-2 px-5 py-3 transition-colors" style={{ fontSize: "13.5px", fontWeight: activeTab === tab.key ? 600 : 500, color: activeTab === tab.key ? "#0E7490" : "#64748b", borderBottom: activeTab === tab.key ? "2px solid #0E7490" : "2px solid transparent", marginBottom: "-1px" }}>
                {tab.label}
                <span className="flex items-center justify-center w-5 h-5 rounded-md" style={{ backgroundColor: activeTab === tab.key ? "#ECFEFF" : "#F1F5F9", color: activeTab === tab.key ? "#0E7490" : "#64748b", fontSize: "11px", fontWeight: 700 }}>{tab.count}</span>
              </button>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 mb-6">
            <div className="flex items-center gap-3 flex-1 px-4 py-3 bg-[#F8FAFC] rounded-xl border-[1.5px] border-slate-200 focus-within:bg-[#FAFCFF] focus-within:border-[#0B5394] focus-within:ring-1 focus-within:ring-[#0B5394] transition-all">
              {isSearching ? <Loader2 size={18} className="text-[#0E7490] animate-spin" /> : <Search size={18} className="text-slate-400" />}
              <input type="text" placeholder="Buscar pacientes por nombre o condición..." value={search} onChange={(e) => setSearch(e.target.value)} className="flex-1 bg-transparent outline-none text-sm font-medium text-slate-700 placeholder-slate-400" />
              {search && <button onClick={() => setSearch("")} className="text-slate-300 hover:text-slate-500 transition-colors"><X size={16} /></button>}
            </div>

            <div className="relative shrink-0">
              <button onClick={() => { const filters: FilterType[] = ["Todos", "Estable", "Observación", "Crítico"]; const idx = filters.indexOf(filter); setFilter(filters[(idx + 1) % filters.length]); }} className="flex items-center gap-2 px-5 py-3 bg-white rounded-xl border-[1.5px] border-slate-200 shadow-sm text-sm font-bold text-slate-700 hover:bg-slate-50 transition-all">
                <SlidersHorizontal size={16} className={filter !== "Todos" ? "text-[#0E7490]" : "text-slate-400"} /> 
                {filter} 
                <ChevronDown size={14} className="text-slate-400 ml-1" />
              </button>
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 pb-8">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="animate-pulse bg-white border border-slate-100 p-5 rounded-2xl h-36 flex flex-col justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-slate-200 shrink-0"></div>
                    <div className="flex-1 py-1">
                      <div className="h-4 bg-slate-200 rounded-md w-3/4 mb-2.5"></div>
                      <div className="h-3 bg-slate-100 rounded-md w-1/2"></div>
                    </div>
                  </div>
                  <div className="flex gap-4 items-center">
                    <div className="h-3 bg-slate-100 rounded-md w-1/4"></div>
                    <div className="h-3 bg-slate-100 rounded-md w-1/4"></div>
                    <div className="h-6 bg-slate-100 rounded-md w-16 ml-auto"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : hasError ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4"><AlertTriangle size={24} className="text-red-500" /></div>
              <h3 className="text-lg font-bold text-slate-900">Error de Conexión</h3>
              <p className="text-sm text-slate-500 mt-1 mb-6 max-w-sm">No pudimos cargar los pacientes. Por favor revisa tu conexión e intenta de nuevo.</p>
              <button onClick={() => loadPatients(false)} className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-bold flex items-center gap-2 transition-all">
                <RefreshCcw size={16} /> Reintentar
              </button>
            </div>
          ) : loadedPatients.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 pb-8">
                {loadedPatients.map((patient: any) => <PatientCard key={patient.id} patient={patient} onClick={onPatientSelect} />)}
              </div>
              {hasMore && (
                <div className="flex justify-center pb-8 mt-2">
                  <button onClick={() => loadPatients(true)} disabled={isLoadingMore} className="px-6 py-2.5 bg-white border-2 border-[#0E7490] text-[#0E7490] hover:bg-cyan-50 rounded-xl text-sm font-bold shadow-sm transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                    {isLoadingMore ? <Loader2 size={16} className="animate-spin" /> : <ChevronDown size={16} />}
                    {isLoadingMore ? "Cargando..." : "Cargar más pacientes"}
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-24 text-center animate-in fade-in duration-300">
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4"><Search size={24} className="text-slate-400" /></div>
              <h3 className="text-lg font-bold text-slate-900">No hay pacientes</h3>
              <p className="text-sm text-slate-500 mt-1 mb-6 max-w-sm mx-auto">No hay expedientes médicos que coincidan con tu búsqueda en este estado. Contacta al administrador si crees que falta información.</p>
            </div>
          )}
        </div>
      </main>

      {/* --- MODAL DE AÑADIR PACIENTE ESTILO LOGIN --- */}
      {isAddModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-slate-900/40 backdrop-blur-sm p-4 overflow-y-auto" onClick={() => addView === "form" && handleAddCancelClick()}>
          {addView === "form" && (
            <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl flex flex-col my-auto border border-slate-100" onClick={e => { e.stopPropagation(); setIsStatusOpen(false); setIsBloodOpen(false); }}>
              <div className="flex items-center gap-3 px-6 py-5 bg-gradient-to-r from-[#0B5394] to-[#0E7490] text-white rounded-t-2xl shadow-sm">
                <UserPlus size={20} />
                <h3 className="text-lg font-bold">Añadir Nuevo Paciente</h3>
              </div>
              <form onSubmit={handleAddPatient} className="p-6 flex flex-col gap-4">
                <div><label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Nombre Completo</label><input type="text" required value={newName} onChange={e => setNewName(e.target.value)} placeholder="Ej. Ana García" className="w-full px-4 py-3 border-[1.5px] border-slate-200 rounded-xl text-sm outline-none focus:border-[#0B5394] focus:ring-1 focus:ring-[#0B5394] transition-all bg-[#F8FAFC] focus:bg-[#FAFCFF]" /></div>
                <div className="flex gap-4">
                  <div className="w-1/3"><label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Edad</label><input type="number" required min="0" value={newAge} onChange={e => setNewAge(e.target.value)} placeholder="Años" className="w-full px-4 py-3 border-[1.5px] border-slate-200 rounded-xl text-sm outline-none focus:border-[#0B5394] focus:ring-1 focus:ring-[#0B5394] transition-all bg-[#F8FAFC] focus:bg-[#FAFCFF]" /></div>
                  <div className="w-2/3"><label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Estado Inicial</label>
                    <div className="relative">
                      <button type="button" onClick={(e) => { e.stopPropagation(); setIsStatusOpen(!isStatusOpen); setIsBloodOpen(false); }} className="w-full px-4 py-3 border-[1.5px] border-slate-200 rounded-xl text-sm flex justify-between items-center outline-none transition-all bg-[#F8FAFC] hover:bg-[#FAFCFF]" style={{ borderColor: isStatusOpen ? "#0B5394" : "" }}>
                        <span className="text-slate-700 font-medium">{statusOptions.find(o => o.value === newStatus)?.label}</span><ChevronDown size={14} className={`text-slate-400 transition-transform ${isStatusOpen ? "rotate-180" : ""}`} />
                      </button>
                      {isStatusOpen && <div className="absolute top-[calc(100%+4px)] left-0 right-0 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden">{statusOptions.map(opt => <button key={opt.value} type="button" onClick={(e) => { e.stopPropagation(); setNewStatus(opt.value as any); setIsStatusOpen(false); }} className={`w-full text-left px-4 py-3 text-sm transition-colors ${newStatus === opt.value ? "bg-cyan-50 text-[#0E7490] font-semibold" : "text-slate-700 hover:bg-slate-50"}`}>{opt.label}</button>)}</div>}
                    </div>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-1/2"><label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Teléfono</label><input type="text" value={newPhone} onChange={e => setNewPhone(e.target.value)} placeholder="+58 414 1234567" className="w-full px-4 py-3 border-[1.5px] border-slate-200 rounded-xl text-sm outline-none focus:border-[#0B5394] focus:ring-1 focus:ring-[#0B5394] transition-all bg-[#F8FAFC] focus:bg-[#FAFCFF]" /></div>
                  <div className="w-1/2"><label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Ubicación</label><input type="text" value={newLocation} onChange={e => setNewLocation(e.target.value)} placeholder="Puerto Ordaz, VE" className="w-full px-4 py-3 border-[1.5px] border-slate-200 rounded-xl text-sm outline-none focus:border-[#0B5394] focus:ring-1 focus:ring-[#0B5394] transition-all bg-[#F8FAFC] focus:bg-[#FAFCFF]" /></div>
                </div>
                <div className="flex gap-4">
                  <div className="w-1/3"><label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Sangre</label>
                    <div className="relative">
                      <button type="button" onClick={(e) => { e.stopPropagation(); setIsBloodOpen(!isBloodOpen); setIsStatusOpen(false); }} className="w-full px-4 py-3 border-[1.5px] border-slate-200 rounded-xl text-sm flex justify-between items-center outline-none transition-all bg-[#F8FAFC] hover:bg-[#FAFCFF]" style={{ borderColor: isBloodOpen ? "#0B5394" : "" }}>
                        <span className="text-slate-700 font-medium">{newBloodType}</span><ChevronDown size={14} className={`text-slate-400 transition-transform ${isBloodOpen ? "rotate-180" : ""}`} />
                      </button>
                      {isBloodOpen && <div className="absolute top-[calc(100%+4px)] left-0 right-0 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-y-auto max-h-48">{bloodOptions.map(blood => <button key={blood} type="button" onClick={(e) => { e.stopPropagation(); setNewBloodType(blood); setIsBloodOpen(false); }} className={`w-full text-left px-4 py-3 text-sm transition-colors ${newBloodType === blood ? "bg-cyan-50 text-[#0E7490] font-semibold" : "text-slate-700 hover:bg-slate-50"}`}>{blood}</button>)}</div>}
                    </div>
                  </div>
                  <div className="w-2/3"><label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Alergias</label><input type="text" value={newAllergies} onChange={e => setNewAllergies(e.target.value)} placeholder="Penicilina, Ninguna" className="w-full px-4 py-3 border-[1.5px] border-slate-200 rounded-xl text-sm outline-none focus:border-[#0B5394] focus:ring-1 focus:ring-[#0B5394] transition-all bg-[#F8FAFC] focus:bg-[#FAFCFF]" /></div>
                </div>
                <div><label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Condición Principal</label><input type="text" required value={newCondition} onChange={e => setNewCondition(e.target.value)} placeholder="Diabetes Tipo 1" className="w-full px-4 py-3 border-[1.5px] border-slate-200 rounded-xl text-sm outline-none focus:border-[#0B5394] focus:ring-1 focus:ring-[#0B5394] transition-all bg-[#F8FAFC] focus:bg-[#FAFCFF]" /></div>
                <div className="flex gap-3 mt-3 pt-5 border-t border-slate-100">
                  <button type="button" onClick={handleAddCancelClick} disabled={isSubmitting} className="flex-1 py-3 rounded-xl font-semibold text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors disabled:opacity-50">Cancelar</button>
                  <button type="submit" disabled={isSubmitting} className="flex-1 py-3 rounded-xl font-bold text-white shadow-[0_4px_14px_rgba(11,83,148,0.35)] hover:shadow-[0_6px_20px_rgba(11,83,148,0.45)] hover:-translate-y-0.5 bg-gradient-to-r from-[#0B5394] to-[#0E7490] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                    {isSubmitting ? <><Loader2 size={16} className="animate-spin" /> Registrando expediente...</> : "Registrar Paciente"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {addView === "confirm-cancel" && (
            <div className="relative w-full mx-4 rounded-2xl bg-white shadow-2xl p-8 text-center" style={{ maxWidth: "360px" }} onClick={(e) => e.stopPropagation()}>
              <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4"><AlertTriangle size={24} className="text-red-500" /></div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">¿Cancelar registro?</h3>
              <p className="text-sm text-slate-500 mb-6">Se perderán los datos introducidos del paciente.</p>
              <div className="flex flex-col gap-3">
                <button onClick={closeAddModal} className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm shadow-[0_4px_14px_rgba(220,38,38,0.35)] hover:shadow-[0_6px_20px_rgba(220,38,38,0.45)] hover:-translate-y-0.5 transition-all duration-200">Sí, descartar datos</button>
                <button onClick={() => setAddView("form")} className="w-full py-3 rounded-xl border-2 border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-sm transition-colors">No, volver al formulario</button>
              </div>
            </div>
          )}

          {addView === "success" && (
            <div className="relative w-full mx-4 rounded-2xl bg-white shadow-2xl p-8 text-center" style={{ maxWidth: "360px" }} onClick={(e) => e.stopPropagation()}>
              <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4 animate-bounce"><CheckCircle2 size={32} className="text-emerald-500" /></div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">¡Paciente Registrado!</h3>
              <p className="text-sm text-slate-500 mb-4"><strong>{newName}</strong> ha sido añadido exitosamente.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
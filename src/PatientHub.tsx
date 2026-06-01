import { useState, useEffect } from "react";
import { 
  Search, SlidersHorizontal, Plus, ChevronDown, AlertTriangle, 
  UserPlus, X, Shield, Bell, CheckCircle2, Info, Activity 
} from "lucide-react";
import { Sidebar } from "./components/Sidebar";
import { PatientCard, type Patient } from "./components/PatientCard";

const patients: Patient[] = [
  { id: "1", name: "Eleanor Hartwell", age: 67, lastVisit: "20 May, 2026", condition: "Hipertensión", status: "estable", initials: "EH", avatarColor: "#0B5394" },
  { id: "2", name: "Marcus Delgado", age: 52, lastVisit: "18 May, 2026", condition: "Diabetes Tipo 2", status: "observacion", initials: "MD", avatarColor: "#047857" },
  { id: "3", name: "Sophie Chen", age: 34, lastVisit: "16 May, 2026", condition: "Asma", status: "estable", initials: "SC", avatarColor: "#7C3AED" },
  { id: "4", name: "Thomas Kwan", age: 71, lastVisit: "14 May, 2026", condition: "Fibrilación Auricular", status: "critico", initials: "TK", avatarColor: "#B45309" },
  { id: "5", name: "Amara Osei", age: 45, lastVisit: "12 May, 2026", condition: "Hipotiroidismo", status: "estable", initials: "AO", avatarColor: "#0E7490" },
  { id: "6", name: "Ivan Petrov", age: 58, lastVisit: "10 May, 2026", condition: "Dolor Crónico de Espalda", status: "observacion", initials: "IP", avatarColor: "#BE185D" },
];

const sharedCases: Patient[] = [
  { id: "s1", name: "Yusuf Al-Farsi", age: 55, lastVisit: "21 May, 2026", condition: "Postoperatorio Cardíaco", status: "critico", initials: "YA", avatarColor: "#991B1B" },
  { id: "s2", name: "Clara Novak", age: 38, lastVisit: "19 May, 2026", condition: "Lupus (LES)", status: "observacion", initials: "CN", avatarColor: "#5B21B6" },
  { id: "s3", name: "James Whitmore", age: 74, lastVisit: "15 May, 2026", condition: "Enfermedad de Parkinson", status: "observacion", initials: "JW", avatarColor: "#1D4ED8" },
];

type TabType = "mis-pacientes" | "casos-compartidos";
type FilterType = "Todos" | "Estable" | "Observación" | "Crítico";

const statusOptions = [{ value: "estable", label: "Estable" }, { value: "observacion", label: "En Observación" }, { value: "critico", label: "Crítico" }];
const bloodOptions = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

interface AppNotification { id: number; type: "assignment" | "alert" | "system" | "update"; title: string; message: string; time: string; read: boolean; patientId?: string; }
const initialNotifications: AppNotification[] = [
  { id: 1, type: "assignment", title: "Interconsulta Asignada", message: "Has sido incluido en el equipo médico de Eleanor Hartwell por el Dr. Abraham Orta.", time: "Hace 10 min", read: false, patientId: "1" },
  { id: 2, type: "alert", title: "Estado Crítico", message: "El paciente Thomas Kwan ha presentado alteraciones y su estado cambió a Crítico.", time: "Hace 1 hora", read: false, patientId: "4" },
  { id: 3, type: "update", title: "Nueva Visita Registrada", message: "La Dra. Sarah Mitchell ha añadido una evolución clínica a Clara Novak.", time: "Hace 3 horas", read: true, patientId: "s2" },
  { id: 4, type: "system", title: "Mantenimiento", message: "Los servidores de CliniData se reiniciarán a las 03:00 AM para actualizaciones HIPAA.", time: "Ayer", read: true }
];

export function PatientHub({ onPatientSelect, onLogout }: { onPatientSelect: (p: Patient) => void, onLogout: () => void }) {
  const [activeTab, setActiveTab] = useState<TabType>("mis-pacientes");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterType>("Todos");
  
  const [localPatients, setLocalPatients] = useState<Patient[]>(patients);
  const [notifications, setNotifications] = useState<AppNotification[]>(initialNotifications);
  
  // Estados de Modales y Paneles
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [isBloodOpen, setIsBloodOpen] = useState(false);

  // Estados del Formulario y Ciclo de Vida (Seguridad contra Race Conditions)
  const [addView, setAddView] = useState<"form" | "confirm-cancel" | "success">("form");
  const [newName, setNewName] = useState("");
  const [newAge, setNewAge] = useState("");
  const [newCondition, setNewCondition] = useState("");
  const [newStatus, setNewStatus] = useState<"estable" | "observacion" | "critico">("estable");
  const [newPhone, setNewPhone] = useState("");
  const [newLocation, setNewLocation] = useState("");
  const [newBloodType, setNewBloodType] = useState("O+");
  const [newAllergies, setNewAllergies] = useState("");

  // === EFECTO MAESTRO PARA BLOQUEAR EL SCROLL ===
  useEffect(() => {
    if (isAddModalOpen || isLogoutModalOpen || isSettingsModalOpen || isNotificationsOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => { document.body.style.overflow = "unset"; };
  }, [isAddModalOpen, isLogoutModalOpen, isSettingsModalOpen, isNotificationsOpen]);

  // === EFECTO SEGURO PARA EL TEMPORIZADOR DEL MODAL ===
  useEffect(() => {
    if (addView === "success") {
      const timer = setTimeout(() => {
        closeAddModal();
      }, 2200);
      return () => clearTimeout(timer);
    }
  }, [addView]);

  const allPatients = activeTab === "mis-pacientes" ? localPatients : sharedCases;

  const filtered = allPatients.filter((p) => {
    const matchSearch = search === "" || p.name.toLowerCase().includes(search.toLowerCase()) || p.condition.toLowerCase().includes(search.toLowerCase());
    const statusMap: Record<string, string> = { "Todos": "all", "Estable": "estable", "Observación": "observacion", "Crítico": "critico" };
    const matchFilter = filter === "Todos" || p.status === statusMap[filter];
    return matchSearch && matchFilter;
  });

  const handleAddPatient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newAge || !newCondition) return;

    const initials = newName.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();
    const colors = ["#0B5394", "#047857", "#7C3AED", "#B45309", "#BE185D"];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    const newPatient: Patient = {
      id: Date.now().toString(), name: newName, age: parseInt(newAge), lastVisit: "Hoy", condition: newCondition, status: newStatus, initials, avatarColor: randomColor, phone: newPhone || "+58 (000) 000-0000", location: newLocation || "No especificada", bloodType: newBloodType, allergies: newAllergies || "Ninguna",
    };

    setLocalPatients([newPatient, ...localPatients]); 
    setAddView("success"); // Activa el temporizador de cierre seguro
  };

  const closeAddModal = () => {
    setIsAddModalOpen(false);
    setAddView("form");
    setNewName(""); setNewAge(""); setNewCondition(""); setNewStatus("estable"); 
    setNewPhone(""); setNewLocation(""); setNewBloodType("O+"); setNewAllergies("");
    setIsStatusOpen(false); setIsBloodOpen(false);
  };

  const handleAddCancelClick = () => {
    const isDirty = newName || newAge || newCondition || newPhone || newLocation || newAllergies;
    if (isDirty) {
      setAddView("confirm-cancel"); // Previene la pérdida de datos
    } else {
      closeAddModal();
    }
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const handleNotificationClick = (notif: AppNotification) => {
    if (!notif.read) setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, read: true } : n));
    if (notif.patientId) {
      const targetPatient = [...localPatients, ...sharedCases].find(p => p.id === notif.patientId);
      if (targetPatient) {
        setIsNotificationsOpen(false);
        onPatientSelect(targetPatient);
      }
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="flex h-screen w-full overflow-hidden" style={{ backgroundColor: "#F8FAFC", fontFamily: "Inter, sans-serif" }}>
      <Sidebar onSettingsClick={() => setIsSettingsModalOpen(true)} onLogoutClick={() => setIsLogoutModalOpen(true)} />

      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* HEADER */}
        <div className="flex items-center justify-between px-8 py-4 bg-white border-b border-gray-100 z-10" style={{ boxShadow: "0 1px 0 rgba(0,0,0,0.04)" }}>
          <div>
            <h1 style={{ fontSize: "18px", fontWeight: 700, color: "#111827", letterSpacing: "-0.2px" }}>Directorio de Pacientes</h1>
            <p style={{ fontSize: "12.5px", fontWeight: 400, color: "#9ca3af", marginTop: "1px" }}>Domingo, 24 de Mayo de 2026</p>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 hidden md:flex mr-2">
              {[
                { label: "Total", value: localPatients.length, color: "#0B5394" },
                { label: "Estables", value: localPatients.filter((p) => p.status === "estable").length, color: "#16A34A" },
                { label: "Críticos", value: localPatients.filter((p) => p.status === "critico").length, color: "#E11D48" },
              ].map((stat) => (
                <div key={stat.label} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: stat.color }} />
                  <span className="text-xs font-bold text-slate-700">{stat.value}</span>
                  <span className="text-xs text-slate-500">{stat.label}</span>
                </div>
              ))}
            </div>
            
            {/* PANEL DE NOTIFICACIONES */}
            <div className="relative">
              <button onClick={() => setIsNotificationsOpen(!isNotificationsOpen)} className={`relative p-2 rounded-xl transition-all ${isNotificationsOpen ? "bg-blue-50 text-[#0B5394]" : "text-slate-400 hover:bg-slate-50 hover:text-slate-700"}`}>
                <Bell size={20} strokeWidth={2} />
                {unreadCount > 0 && <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>}
              </button>

              {isNotificationsOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsNotificationsOpen(false)}></div>
                  <div className="absolute right-0 top-[calc(100%+8px)] w-80 bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 overflow-hidden flex flex-col transform origin-top-right transition-all">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/50">
                      <h3 className="text-sm font-bold text-slate-800">Notificaciones</h3>
                      {unreadCount > 0 && <button onClick={markAllAsRead} className="text-xs font-semibold text-[#0B5394] hover:text-[#094074]">Marcar leídas</button>}
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="py-8 text-center text-slate-500 text-sm">No tienes notificaciones nuevas.</div>
                      ) : (
                        notifications.map(notif => (
                          <div key={notif.id} onClick={() => handleNotificationClick(notif)} className={`p-4 border-b border-slate-50 transition-colors ${!notif.read ? "bg-blue-50/30" : ""} ${notif.patientId ? "cursor-pointer hover:bg-slate-50" : "cursor-default"}`}>
                            <div className="flex gap-3">
                              <div className="mt-0.5 shrink-0">
                                {notif.type === "assignment" && <UserPlus size={16} className="text-[#0B5394]" />}
                                {notif.type === "alert" && <AlertTriangle size={16} className="text-red-500" />}
                                {notif.type === "update" && <Activity size={16} className="text-amber-500" />}
                                {notif.type === "system" && <Info size={16} className="text-slate-400" />}
                              </div>
                              <div className="flex-1">
                                <p className={`text-sm ${!notif.read ? "font-bold text-slate-900" : "font-medium text-slate-700"}`}>{notif.title}</p>
                                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{notif.message}</p>
                                <p className="text-[10px] font-semibold text-slate-400 mt-2 uppercase tracking-wider">{notif.time}</p>
                              </div>
                              {!notif.read && <div className="w-2 h-2 rounded-full bg-[#0B5394] mt-1.5 shrink-0"></div>}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="w-px h-6 bg-slate-200 hidden md:block"></div>
            
            <button onClick={() => setIsAddModalOpen(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white transition-all shadow-sm hover:shadow bg-[#0B5394] hover:bg-[#094074] text-sm font-bold">
              <Plus size={16} strokeWidth={2.5} /> Añadir Paciente
            </button>
          </div>
        </div>

        {/* CONTENIDO PRINCIPAL */}
        <div className="flex-1 overflow-y-auto px-8 py-6">
          <div className="flex items-center gap-0 mb-6 border-b border-slate-200">
            {[
              { key: "mis-pacientes" as TabType, label: "Mis Pacientes", count: localPatients.length },
              { key: "casos-compartidos" as TabType, label: "Casos Compartidos", count: sharedCases.length },
            ].map((tab) => (
              <button key={tab.key} onClick={() => { setActiveTab(tab.key); setSearch(""); setFilter("Todos"); }} className="relative flex items-center gap-2 px-5 py-3 transition-colors" style={{ fontSize: "13.5px", fontWeight: activeTab === tab.key ? 600 : 500, color: activeTab === tab.key ? "#0B5394" : "#64748b", borderBottom: activeTab === tab.key ? "2px solid #0B5394" : "2px solid transparent", marginBottom: "-1px" }}>
                {tab.label}
                <span className="flex items-center justify-center w-5 h-5 rounded-md" style={{ backgroundColor: activeTab === tab.key ? "#EFF6FF" : "#F1F5F9", color: activeTab === tab.key ? "#0B5394" : "#64748b", fontSize: "11px", fontWeight: 700 }}>{tab.count}</span>
              </button>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 mb-6">
            <div className="flex items-center gap-3 flex-1 px-4 py-3 bg-white rounded-xl border border-slate-200 shadow-sm focus-within:border-[#0B5394] focus-within:ring-1 focus-within:ring-[#0B5394] transition-all">
              <Search size={18} className="text-slate-400" />
              <input type="text" placeholder="Buscar pacientes por nombre o condición..." value={search} onChange={(e) => setSearch(e.target.value)} className="flex-1 bg-transparent outline-none text-sm font-medium text-slate-700 placeholder-slate-400" />
              {search && <button onClick={() => setSearch("")} className="text-slate-300 hover:text-slate-500 transition-colors"><X size={16} /></button>}
            </div>

            <div className="relative shrink-0">
              <button onClick={() => { const filters: FilterType[] = ["Todos", "Estable", "Observación", "Crítico"]; const idx = filters.indexOf(filter); setFilter(filters[(idx + 1) % filters.length]); }} className="flex items-center gap-2 px-5 py-3 bg-white rounded-xl border border-slate-200 shadow-sm text-sm font-bold text-slate-700 hover:bg-slate-50 transition-all">
                <SlidersHorizontal size={16} className={filter !== "Todos" ? "text-[#0B5394]" : "text-slate-400"} /> 
                {filter} 
                <ChevronDown size={14} className="text-slate-400 ml-1" />
              </button>
            </div>
          </div>

          {filtered.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 pb-8">
              {filtered.map((patient) => <PatientCard key={patient.id} patient={patient} onClick={onPatientSelect} />)}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4"><Search size={24} className="text-slate-400" /></div>
              <h3 className="text-lg font-bold text-slate-900">No se encontraron pacientes</h3>
              <p className="text-sm text-slate-500 mt-1 max-w-sm">No hay resultados que coincidan con tu búsqueda actual. Intenta con otros términos o limpia los filtros.</p>
              <button onClick={() => { setSearch(""); setFilter("Todos"); }} className="mt-6 px-5 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-bold hover:bg-slate-800 transition-colors">Limpiar filtros</button>
            </div>
          )}
        </div>
      </main>

      {/* --- ZONA DE MODALES SECUNDARIOS --- */}

      {isLogoutModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsLogoutModalOpen(false)}>
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl p-6 text-center" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4"><AlertTriangle size={24} className="text-red-500" /></div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">¿Cerrar Sesión?</h3>
            <p className="text-sm text-slate-500 mb-6">Tendrás que volver a ingresar tus credenciales institucionales para acceder a CliniData.</p>
            <div className="flex gap-3">
              <button onClick={() => setIsLogoutModalOpen(false)} className="flex-1 py-2.5 rounded-xl font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors">Cancelar</button>
              <button onClick={onLogout} className="flex-1 py-2.5 rounded-xl font-bold text-white bg-red-600 hover:bg-red-700 transition-colors">Cerrar Sesión</button>
            </div>
          </div>
        </div>
      )}

      {isSettingsModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsSettingsModalOpen(false)}>
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">Configuración de Seguridad</h3>
              <button onClick={() => setIsSettingsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-6">
              <div className="flex items-start justify-between">
                <div className="flex gap-3">
                  <Shield className="text-[#0B5394] shrink-0 mt-1" size={20} />
                  <div><h4 className="text-sm font-bold text-slate-800">Autenticación de Dos Pasos (2FA)</h4><p className="text-xs text-slate-500 mt-1 leading-relaxed">Requiere un código de la app autenticadora además de tu contraseña.</p></div>
                </div>
                <div className="w-10 h-6 bg-[#0B5394] rounded-full relative cursor-pointer shadow-inner"><div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div></div>
              </div>
              <div className="h-px bg-slate-100"></div>
              <div className="flex items-start justify-between">
                <div className="flex gap-3">
                  <Bell className="text-[#0B5394] shrink-0 mt-1" size={20} />
                  <div><h4 className="text-sm font-bold text-slate-800">Alertas de Interconsulta</h4><p className="text-xs text-slate-500 mt-1 leading-relaxed">Recibir un correo electrónico cuando un colega te comparta un caso.</p></div>
                </div>
                <div className="w-10 h-6 bg-[#0B5394] rounded-full relative cursor-pointer shadow-inner"><div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div></div>
              </div>
            </div>
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button onClick={() => setIsSettingsModalOpen(false)} className="px-6 py-2.5 bg-[#0B5394] text-white text-sm font-bold rounded-xl hover:bg-[#094074]">Guardar Cambios</button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL DE AÑADIR PACIENTE (CON CICLO DE VIDA PROTEGIDO) --- */}
      {isAddModalOpen && (
        <div 
          className="fixed inset-0 flex items-center justify-center z-50 bg-slate-900/40 backdrop-blur-sm p-4 overflow-y-auto" 
          onClick={() => addView === "form" && handleAddCancelClick()}
        >
          {addView === "form" && (
            <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl flex flex-col my-auto" onClick={e => { e.stopPropagation(); setIsStatusOpen(false); setIsBloodOpen(false); }}>
              
              <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-100 bg-[#0B5394] text-white rounded-t-2xl">
                <UserPlus size={20} />
                <h3 className="text-lg font-bold">Añadir Nuevo Paciente</h3>
              </div>

              <form onSubmit={handleAddPatient} className="p-6 flex flex-col gap-4">
                <div><label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Nombre Completo</label><input type="text" required value={newName} onChange={e => setNewName(e.target.value)} placeholder="Ej. Ana García" className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-[#0B5394]" /></div>
                
                <div className="flex gap-4">
                  <div className="w-1/3"><label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Edad</label><input type="number" required min="0" value={newAge} onChange={e => setNewAge(e.target.value)} placeholder="Años" className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-[#0B5394]" /></div>
                  
                  <div className="w-2/3"><label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Estado Inicial</label>
                    <div className="relative">
                      <button type="button" onClick={(e) => { e.stopPropagation(); setIsStatusOpen(!isStatusOpen); setIsBloodOpen(false); }} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-white flex justify-between items-center outline-none transition-colors" style={{ borderColor: isStatusOpen ? "#0B5394" : "#E2E8F0" }}>
                        <span className="text-slate-700 font-medium">{statusOptions.find(o => o.value === newStatus)?.label}</span>
                        <ChevronDown size={14} className={`text-slate-400 transition-transform ${isStatusOpen ? "rotate-180" : ""}`} />
                      </button>
                      {isStatusOpen && (
                        <div className="absolute top-[calc(100%+4px)] left-0 right-0 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden">
                          {statusOptions.map(opt => <button key={opt.value} type="button" onClick={(e) => { e.stopPropagation(); setNewStatus(opt.value as any); setIsStatusOpen(false); }} className={`w-full text-left px-4 py-3 text-sm transition-colors ${newStatus === opt.value ? "bg-blue-50 text-[#0B5394] font-semibold" : "text-slate-700 hover:bg-slate-50"}`}>{opt.label}</button>)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-1/2"><label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Teléfono</label><input type="text" value={newPhone} onChange={e => setNewPhone(e.target.value)} placeholder="Ej. +58 414 1234567" className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-[#0B5394]" /></div>
                  <div className="w-1/2"><label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Ubicación</label><input type="text" value={newLocation} onChange={e => setNewLocation(e.target.value)} placeholder="Ej. Puerto Ordaz, VE" className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-[#0B5394]" /></div>
                </div>

                <div className="flex gap-4">
                  <div className="w-1/3"><label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Sangre</label>
                    <div className="relative">
                      <button type="button" onClick={(e) => { e.stopPropagation(); setIsBloodOpen(!isBloodOpen); setIsStatusOpen(false); }} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-white flex justify-between items-center outline-none transition-colors" style={{ borderColor: isBloodOpen ? "#0B5394" : "#E2E8F0" }}>
                        <span className="text-slate-700 font-medium">{newBloodType}</span>
                        <ChevronDown size={14} className={`text-slate-400 transition-transform ${isBloodOpen ? "rotate-180" : ""}`} />
                      </button>
                      {isBloodOpen && (
                        <div className="absolute top-[calc(100%+4px)] left-0 right-0 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-y-auto max-h-48">
                          {bloodOptions.map(blood => <button key={blood} type="button" onClick={(e) => { e.stopPropagation(); setNewBloodType(blood); setIsBloodOpen(false); }} className={`w-full text-left px-4 py-2 text-sm transition-colors ${newBloodType === blood ? "bg-blue-50 text-[#0B5394] font-semibold" : "text-slate-700 hover:bg-slate-50"}`}>{blood}</button>)}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="w-2/3"><label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Alergias</label><input type="text" value={newAllergies} onChange={e => setNewAllergies(e.target.value)} placeholder="Ej. Penicilina, Ninguna" className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-[#0B5394]" /></div>
                </div>

                <div><label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Condición Médica Principal</label><input type="text" required value={newCondition} onChange={e => setNewCondition(e.target.value)} placeholder="Ej. Diabetes Tipo 1" className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-[#0B5394]" /></div>
                
                <div className="flex gap-3 mt-2 pt-4 border-t border-slate-100">
                  <button type="button" onClick={handleAddCancelClick} className="flex-1 py-2.5 rounded-xl font-semibold text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors">Cancelar</button>
                  <button type="submit" className="flex-1 py-2.5 rounded-xl font-bold text-white bg-[#0B5394] hover:bg-[#094074] transition-colors">Registrar Paciente</button>
                </div>
              </form>
            </div>
          )}

          {addView === "confirm-cancel" && (
            <div className="relative w-full mx-4 rounded-2xl bg-white shadow-2xl p-8 text-center" style={{ maxWidth: "360px", fontFamily: "'Inter', sans-serif" }} onClick={(e) => e.stopPropagation()}>
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                <AlertTriangle size={24} className="text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">¿Cancelar registro?</h3>
              <p className="text-sm text-slate-500 mb-6">Se perderán los datos introducidos del paciente.</p>
              <div className="flex flex-col gap-2">
                <button onClick={closeAddModal} className="w-full py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm transition-colors">Sí, descartar datos</button>
                <button onClick={() => setAddView("form")} className="w-full py-2.5 rounded-xl border-2 border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-sm transition-colors">No, volver al formulario</button>
              </div>
            </div>
          )}

          {addView === "success" && (
            <div className="relative w-full mx-4 rounded-2xl bg-white shadow-2xl p-8 text-center" style={{ maxWidth: "360px", fontFamily: "'Inter', sans-serif" }} onClick={(e) => e.stopPropagation()}>
              <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4 animate-bounce">
                <CheckCircle2 size={32} className="text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">¡Paciente Registrado!</h3>
              <p className="text-sm text-slate-500 mb-4"><strong>{newName}</strong> ha sido añadido exitosamente al directorio.</p>
              <p className="text-xs text-slate-400 font-medium">Cerrando automáticamente...</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
import { useState } from "react";
import { Search, SlidersHorizontal, Plus, ChevronDown, AlertTriangle, UserPlus, X, Shield, Bell } from "lucide-react";
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

export function PatientHub({ onPatientSelect, onLogout }: { onPatientSelect: (p: Patient) => void, onLogout: () => void }) {
  const [activeTab, setActiveTab] = useState<TabType>("mis-pacientes");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterType>("Todos");
  
  // Lista de pacientes dinámica
  const [localPatients, setLocalPatients] = useState<Patient[]>(patients);
  
  // Estados para los Modales
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  // Estados para el formulario de nuevo paciente
  const [newName, setNewName] = useState("");
  const [newAge, setNewAge] = useState("");
  const [newCondition, setNewCondition] = useState("");
  const [newStatus, setNewStatus] = useState<"estable" | "observacion" | "critico">("estable");

  const allPatients = activeTab === "mis-pacientes" ? localPatients : sharedCases;

  const filtered = allPatients.filter((p) => {
    const matchSearch = search === "" || p.name.toLowerCase().includes(search.toLowerCase()) || p.condition.toLowerCase().includes(search.toLowerCase());
    
    // Mapeo inverso para comparar el filtro en español con el estado en minúsculas
    const statusMap: Record<string, string> = { "Todos": "all", "Estable": "estable", "Observación": "observacion", "Crítico": "critico" };
    const matchFilter = filter === "Todos" || p.status === statusMap[filter];
    
    return matchSearch && matchFilter;
  });

  const handleAddPatient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newAge || !newCondition) return;

    // Generar iniciales
    const initials = newName.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();
    
    // Colores aleatorios para el avatar
    const colors = ["#0B5394", "#047857", "#7C3AED", "#B45309", "#BE185D"];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    const newPatient: Patient = {
      id: Date.now().toString(),
      name: newName,
      age: parseInt(newAge),
      lastVisit: "Hoy",
      condition: newCondition,
      status: newStatus,
      initials,
      avatarColor: randomColor,
    };

    setLocalPatients([newPatient, ...localPatients]); // Agrega al principio de la lista
    
    // Limpiar y cerrar
    setNewName(""); setNewAge(""); setNewCondition(""); setNewStatus("estable");
    setIsAddModalOpen(false);
  };

  return (
    <div className="flex h-screen w-full overflow-hidden" style={{ backgroundColor: "#F8FAFC", fontFamily: "Inter, sans-serif" }}>
      <Sidebar onSettingsClick={() => setIsSettingsModalOpen(true)} onLogoutClick={() => setIsLogoutModalOpen(true)} />

      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-8 py-4 bg-white border-b border-gray-100" style={{ boxShadow: "0 1px 0 rgba(0,0,0,0.04)" }}>
          <div>
            <h1 style={{ fontSize: "18px", fontWeight: 700, color: "#111827", letterSpacing: "-0.2px" }}>Directorio de Pacientes</h1>
            <p style={{ fontSize: "12.5px", fontWeight: 400, color: "#9ca3af", marginTop: "1px" }}>Domingo, 24 de Mayo de 2026</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              {[
                { label: "Total", value: localPatients.length, color: "#0B5394" },
                { label: "Estables", value: localPatients.filter((p) => p.status === "estable").length, color: "#16A34A" },
                { label: "Críticos", value: localPatients.filter((p) => p.status === "critico").length, color: "#E11D48" },
              ].map((stat) => (
                <div key={stat.label} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg" style={{ backgroundColor: "#F8FAFC", border: "1px solid rgba(0,0,0,0.06)" }}>
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: stat.color }} />
                  <span style={{ fontSize: "12px", fontWeight: 600, color: "#374151" }}>{stat.value}</span>
                  <span style={{ fontSize: "12px", fontWeight: 400, color: "#9ca3af" }}>{stat.label}</span>
                </div>
              ))}
            </div>
            
            {/* BOTÓN CON EVENTO ONCLICK INYECTADO */}
            <button onClick={() => setIsAddModalOpen(true)} className="flex items-center gap-2 px-4 py-2 rounded-lg text-white transition-opacity hover:opacity-90" style={{ backgroundColor: "#0B5394", fontSize: "13px", fontWeight: 600 }}>
              <Plus size={14} strokeWidth={2.5} /> Añadir Paciente
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-8 py-6">
          <div className="flex items-center gap-0 mb-6" style={{ borderBottom: "1px solid #E5E7EB" }}>
            {[
              { key: "mis-pacientes" as TabType, label: "Mis Pacientes", count: localPatients.length },
              { key: "casos-compartidos" as TabType, label: "Casos Compartidos", count: sharedCases.length },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => { setActiveTab(tab.key); setSearch(""); setFilter("Todos"); }}
                className="relative flex items-center gap-2 px-5 py-3 transition-colors"
                style={{ fontSize: "13.5px", fontWeight: activeTab === tab.key ? 600 : 400, color: activeTab === tab.key ? "#0B5394" : "#9ca3af", borderBottom: activeTab === tab.key ? "2px solid #0B5394" : "2px solid transparent", marginBottom: "-1px", background: "none", cursor: "pointer" }}
              >
                {tab.label}
                <span className="flex items-center justify-center w-5 h-5 rounded-full" style={{ backgroundColor: activeTab === tab.key ? "#EBF2FA" : "#F3F4F6", color: activeTab === tab.key ? "#0B5394" : "#9ca3af", fontSize: "10px", fontWeight: 600 }}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 mb-6">
            <div className="flex items-center gap-3 flex-1 px-4 py-3 bg-white rounded-lg" style={{ border: "1px solid rgba(0,0,0,0.08)", boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}>
              <Search size={16} color="#9ca3af" strokeWidth={2} />
              <input type="text" placeholder="Buscar pacientes por nombre o condición..." value={search} onChange={(e) => setSearch(e.target.value)} className="flex-1 bg-transparent outline-none" style={{ fontSize: "14px", fontWeight: 400, color: "#374151", fontFamily: "Inter, sans-serif" }} />
              {search && <button onClick={() => setSearch("")} className="text-gray-300 hover:text-gray-500 transition-colors" style={{ fontSize: "18px", lineHeight: 1 }}>×</button>}
            </div>

            <div className="relative">
              <button onClick={() => { const filters: FilterType[] = ["Todos", "Estable", "Observación", "Crítico"]; const idx = filters.indexOf(filter); setFilter(filters[(idx + 1) % filters.length]); }} className="flex items-center gap-2 px-4 py-3 bg-white rounded-lg" style={{ border: "1px solid rgba(0,0,0,0.08)", boxShadow: "0 1px 2px rgba(0,0,0,0.04)", fontSize: "13.5px", fontWeight: 500, color: filter === "Todos" ? "#6B7280" : "#0B5394", fontFamily: "Inter, sans-serif" }}>
                <SlidersHorizontal size={14} strokeWidth={2} /> {filter} <ChevronDown size={13} strokeWidth={2} />
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between mb-4">
            <p style={{ fontSize: "12.5px", fontWeight: 500, color: "#9ca3af" }}>
              {filtered.length === 0 ? "No se encontraron pacientes" : `${filtered.length} paciente${filtered.length !== 1 ? "s" : ""} encontrado${filtered.length !== 1 ? "s" : ""}`}
            </p>
            <div className="flex items-center gap-1">
              <span style={{ fontSize: "12px", fontWeight: 400, color: "#9ca3af" }}>Ordenar por:</span>
              <button style={{ fontSize: "12px", fontWeight: 600, color: "#0B5394" }}>Última Visita</button>
            </div>
          </div>

          {filtered.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pb-8">
              {filtered.map((patient) => <PatientCard key={patient.id} patient={patient} onClick={onPatientSelect} />)}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="flex items-center justify-center w-12 h-12 rounded-full mb-4" style={{ backgroundColor: "#F3F4F6" }}><Search size={20} color="#9ca3af" /></div>
              <p style={{ fontSize: "14px", fontWeight: 600, color: "#374151" }}>Sin resultados</p>
              <p style={{ fontSize: "13px", fontWeight: 400, color: "#9ca3af", marginTop: "4px" }}>Intenta ajustar tu búsqueda o filtro</p>
              <button onClick={() => { setSearch(""); setFilter("Todos"); }} className="mt-4 px-4 py-2 rounded-lg" style={{ backgroundColor: "#EBF2FA", color: "#0B5394", fontSize: "13px", fontWeight: 600 }}>
                Limpiar filtros
              </button>
            </div>
          )}
        </div>
      </main>

      {/* MODALES */}
      {isLogoutModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsLogoutModalOpen(false)}>
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl p-6 text-center" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={24} className="text-red-500" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">¿Cerrar Sesión?</h3>
            <p className="text-sm text-slate-500 mb-6">Tendrás que volver a ingresar tus credenciales institucionales para acceder a CliniData.</p>
            <div className="flex gap-3">
              <button onClick={() => setIsLogoutModalOpen(false)} className="flex-1 py-2.5 rounded-xl font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors">
                Cancelar
              </button>
              <button onClick={onLogout} className="flex-1 py-2.5 rounded-xl font-bold text-white bg-red-600 hover:bg-red-700 transition-colors">
                Cerrar Sesión
              </button>
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
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">Autenticación de Dos Pasos (2FA)</h4>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">Requiere un código de la app autenticadora además de tu contraseña.</p>
                  </div>
                </div>
                <div className="w-10 h-6 bg-[#0B5394] rounded-full relative cursor-pointer shadow-inner">
                  <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
                </div>
              </div>
              <div className="h-px bg-slate-100"></div>
              <div className="flex items-start justify-between">
                <div className="flex gap-3">
                  <Bell className="text-[#0B5394] shrink-0 mt-1" size={20} />
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">Alertas de Interconsulta</h4>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">Recibir un correo electrónico cuando un colega te comparta un caso.</p>
                  </div>
                </div>
                <div className="w-10 h-6 bg-[#0B5394] rounded-full relative cursor-pointer shadow-inner">
                  <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button onClick={() => setIsSettingsModalOpen(false)} className="px-6 py-2 bg-[#0B5394] text-white text-sm font-bold rounded-lg hover:bg-[#094074]">Guardar Cambios</button>
            </div>
          </div>
        </div>
      )}

      {isAddModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsAddModalOpen(false)}>
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-100 bg-[#0B5394] text-white">
              <UserPlus size={20} />
              <h3 className="text-lg font-bold">Añadir Nuevo Paciente</h3>
            </div>
            <form onSubmit={handleAddPatient} className="p-6 flex flex-col gap-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Nombre Completo</label>
                <input type="text" required value={newName} onChange={e => setNewName(e.target.value)} placeholder="Ej. Ana García" className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-[#0B5394]" />
              </div>
              <div className="flex gap-4">
                <div className="w-1/3">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Edad</label>
                  <input type="number" required min="0" value={newAge} onChange={e => setNewAge(e.target.value)} placeholder="Años" className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-[#0B5394]" />
                </div>
                <div className="w-2/3">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Estado Inicial</label>
                  <select value={newStatus} onChange={e => setNewStatus(e.target.value as any)} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-[#0B5394] bg-white">
                    <option value="estable">Estable</option>
                    <option value="observacion">En Observación</option>
                    <option value="critico">Crítico</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Condición Médica Principal</label>
                <input type="text" required value={newCondition} onChange={e => setNewCondition(e.target.value)} placeholder="Ej. Diabetes Tipo 1" className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-[#0B5394]" />
              </div>
              
              <div className="flex gap-3 mt-4 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="flex-1 py-2.5 rounded-xl font-semibold text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors">
                  Cancelar
                </button>
                <button type="submit" className="flex-1 py-2.5 rounded-xl font-bold text-white bg-[#0B5394] hover:bg-[#094074] transition-colors">
                  Registrar Paciente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
import React, { useState, useEffect } from "react";
import { Activity, Clock, User, CheckCircle2, AlertCircle, HeartPulse, Thermometer, Weight, ChevronRight, Loader2, Search, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { appointmentService } from "../services/appointmentService";
import { visitService } from "../services/visitService";
import type { GlobalAppointment } from "../types";

const getTodayStr = () => {
  const d = new Date();
  const offset = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - offset).toISOString().split('T')[0];
};

export function TriageHub() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<GlobalAppointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Triage Modal State
  const [selectedAppt, setSelectedAppt] = useState<GlobalAppointment | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [triageForm, setTriageForm] = useState({
    presionArterial: "",
    temperatura: "",
    frecuenciaCardiaca: "",
    peso: "",
    motivo: ""
  });

  const loadAppointments = async () => {
    setIsLoading(true);
    try {
      const data = await appointmentService.getAppointmentsByDate(getTodayStr());
      // For triage, we mainly care about 'pendiente'. Once triage is done, we'll set it to 'confirmada'
      setAppointments(data);
    } catch (err) {
      console.error("Error loading appointments:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAppointments();
    // Auto-refresh every 30 seconds for real-time waiting room
    const interval = setInterval(loadAppointments, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleOpenTriage = (appt: GlobalAppointment) => {
    setSelectedAppt(appt);
    setTriageForm({ presionArterial: "", temperatura: "", frecuenciaCardiaca: "", peso: "", motivo: "" });
    setIsModalOpen(true);
  };

  const handleTriageSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAppt || isSubmitting) return;

    setIsSubmitting(true);
    try {
      // 1. Crear el registro de Triaje Inicial (Consulta parcial)
      await visitService.createTriage(selectedAppt.patientId, triageForm);
      
      // 2. Cambiar el estado de la cita a confirmada (Lista para el doctor)
      await appointmentService.updateAppointment(selectedAppt.id, { status: "confirmada" });
      
      setIsModalOpen(false);
      loadAppointments(); // Recargar lista
    } catch (err) {
      console.error(err);
      alert("Error al registrar el triaje.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredAppts = appointments.filter(a => 
    a.patientName.toLowerCase().includes(searchQuery.toLowerCase())
  ).sort((a, b) => {
    // Pendientes primero, luego confirmadas, luego completadas
    const statusOrder: Record<string, number> = { pendiente: 0, confirmada: 1, completada: 2, cancelada: 3 };
    return (statusOrder[a.status] ?? 4) - (statusOrder[b.status] ?? 4);
  });

  return (
    <div className="min-h-screen bg-slate-50 font-inter">
      <header className="bg-gradient-to-r from-emerald-600 to-teal-700 w-full px-8 py-5 shadow-md">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <Activity className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-white text-xl font-bold leading-tight">Módulo de Triaje</h1>
              <p className="text-emerald-100 text-sm font-medium">CliniData - Enfermería</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-white font-bold text-sm">{user?.name}</p>
              <p className="text-emerald-100 text-xs">Lic. en Enfermería</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-emerald-800 flex items-center justify-center text-white font-bold border-2 border-emerald-400">
              {user?.name?.charAt(0) || "E"}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Sala de Espera ({filteredAppts.filter(a => a.status === 'pendiente').length} en espera)</h2>
            <p className="text-slate-500 text-sm mt-1">Pacientes agendados para hoy ({new Date().toLocaleDateString()})</p>
          </div>
          
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text"
              placeholder="Buscar paciente..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all shadow-sm"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Loader2 className="animate-spin mb-4 text-emerald-500" size={32} />
            <p className="font-medium text-sm">Cargando sala de espera...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredAppts.map(appt => {
              const isPending = appt.status === "pendiente";
              const isReady = appt.status === "confirmada";
              
              return (
                <div key={appt.id} className={`bg-white rounded-2xl p-5 border shadow-sm transition-all ${isPending ? 'border-emerald-200 shadow-emerald-100/50 hover:shadow-md' : 'border-slate-100 opacity-75'}`}>
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${isPending ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                        <User size={18} />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-800 line-clamp-1">{appt.patientName}</h3>
                        <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 mt-0.5">
                          <Clock size={12} /> {appt.time}
                        </div>
                      </div>
                    </div>
                    {isPending ? (
                      <span className="px-2.5 py-1 bg-amber-50 text-amber-700 rounded-lg text-xs font-bold border border-amber-200 whitespace-nowrap">
                        Esperando Triaje
                      </span>
                    ) : isReady ? (
                      <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-bold border border-emerald-200 whitespace-nowrap flex items-center gap-1">
                        <CheckCircle2 size={12} /> Listo p/ Doctor
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold border border-slate-200">
                        Atendido
                      </span>
                    )}
                  </div>
                  
                  <div className="text-sm text-slate-600 mb-4 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <p className="font-semibold text-slate-700 text-xs mb-1 uppercase tracking-wider">Cita para Especialista:</p>
                    <p className="line-clamp-2">Dr/Dra. {appt.doctorName}</p>
                  </div>

                  {isPending && (
                    <button 
                      onClick={() => handleOpenTriage(appt)}
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-sm"
                    >
                      <Activity size={16} /> Realizar Triaje
                    </button>
                  )}
                  {!isPending && (
                    <button disabled className="w-full py-2.5 bg-slate-50 text-slate-400 rounded-xl text-sm font-bold border border-slate-200 flex items-center justify-center gap-2">
                      Triaje Completado
                    </button>
                  )}
                </div>
              );
            })}
            
            {filteredAppts.length === 0 && (
              <div className="col-span-full text-center py-16 bg-white rounded-2xl border border-slate-100 border-dashed">
                <AlertCircle className="mx-auto text-slate-300 mb-3" size={40} />
                <h3 className="text-slate-800 font-bold mb-1">No hay pacientes agendados para hoy</h3>
                <p className="text-sm text-slate-500">Los pacientes que sean agendados aparecerán aquí.</p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Modal de Triaje */}
      {isModalOpen && selectedAppt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 bg-gradient-to-r from-emerald-600 to-teal-700 text-white flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2">
                <Activity size={20} />
                <h2 className="text-lg font-bold">Registro de Triaje Inicial</h2>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-white/80 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleTriageSubmit} className="p-6 overflow-y-auto flex-1">
              <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 mb-6">
                <p className="text-xs font-bold text-emerald-800 uppercase tracking-widest mb-1">Paciente</p>
                <p className="text-lg font-bold text-emerald-900">{selectedAppt.patientName}</p>
                <p className="text-sm font-medium text-emerald-700 mt-1">Cita con: Dr/Dra. {selectedAppt.doctorName}</p>
              </div>

              <h3 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2 flex items-center gap-2">
                <HeartPulse size={16} className="text-rose-500" /> Signos Vitales
              </h3>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Presión Arterial (mmHg)</label>
                  <input 
                    type="text" 
                    placeholder="Ej. 120/80" 
                    required
                    value={triageForm.presionArterial}
                    onChange={e => setTriageForm({...triageForm, presionArterial: e.target.value})}
                    className="w-full px-3 py-2 border-2 border-slate-200 rounded-xl text-sm outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1 flex items-center gap-1"><HeartPulse size={12} /> Frec. Cardíaca (lpm)</label>
                  <input 
                    type="number" 
                    placeholder="Ej. 75" 
                    required
                    value={triageForm.frecuenciaCardiaca}
                    onChange={e => setTriageForm({...triageForm, frecuenciaCardiaca: e.target.value})}
                    className="w-full px-3 py-2 border-2 border-slate-200 rounded-xl text-sm outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1 flex items-center gap-1"><Thermometer size={12} /> Temperatura (°C)</label>
                  <input 
                    type="number" 
                    step="0.1"
                    placeholder="Ej. 36.5" 
                    required
                    value={triageForm.temperatura}
                    onChange={e => setTriageForm({...triageForm, temperatura: e.target.value})}
                    className="w-full px-3 py-2 border-2 border-slate-200 rounded-xl text-sm outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1 flex items-center gap-1"><Weight size={12} /> Peso (kg)</label>
                  <input 
                    type="number" 
                    step="0.1"
                    placeholder="Ej. 70.5" 
                    required
                    value={triageForm.peso}
                    onChange={e => setTriageForm({...triageForm, peso: e.target.value})}
                    className="w-full px-3 py-2 border-2 border-slate-200 rounded-xl text-sm outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
              </div>

              <h3 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">Motivo Principal</h3>
              <div className="mb-2">
                <textarea 
                  required
                  rows={3}
                  placeholder="¿Por qué acude el paciente a la clínica hoy? (Descripción inicial)"
                  value={triageForm.motivo}
                  onChange={e => setTriageForm({...triageForm, motivo: e.target.value})}
                  className="w-full px-3 py-2 border-2 border-slate-200 rounded-xl text-sm outline-none focus:border-emerald-500 transition-colors resize-none"
                />
              </div>

              <div className="mt-8 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border-2 border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="flex-[2] py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? <><Loader2 size={16} className="animate-spin" /> Guardando...</> : <><CheckCircle2 size={16} /> Guardar Triaje y Avisar al Doctor</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

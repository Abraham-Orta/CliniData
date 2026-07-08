import React, { useState, useEffect } from "react";
import { X, UserPlus, ChevronDown, CheckSquare, Square, Search, CheckCircle2, AlertTriangle, Loader2, Calendar as CalendarIcon, Clock } from "lucide-react";
import { colaboradorService, type Colaborador } from "../services/colaboradorService";
import { appointmentService } from "../services/appointmentService";

interface Props {
  onClose: () => void;
  patientId: string;
  patientName: string;
  onReferralSuccess: () => void;
}

type ModalView = "form" | "confirm-cancel" | "success";

export function ReferralModal({ onClose, patientId, patientName, onReferralSuccess }: Props) {
  const [colleagues, setColleagues] = useState<Colaborador[]>([]);
  const [loadingColleagues, setLoadingColleagues] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDoctorId, setSelectedDoctorId] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [view, setView] = useState<ModalView>("form");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  useEffect(() => {
    if (view === "success") {
      const timer = setTimeout(() => {
        onClose();
      }, 2200);
      return () => clearTimeout(timer);
    }
  }, [view, onClose]);

  useEffect(() => {
    colaboradorService.getMedicosDisponibles().then((docs) => {
      setColleagues(docs);
      setLoadingColleagues(false);
    }).catch(err => {
      console.error(err);
      setLoadingColleagues(false);
    });
  }, []);

  const filteredColleagues = colleagues.filter((c) =>
    `${c.nombre} ${c.apellido}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isFormValid = selectedDoctorId !== null && reason.trim().length > 0 && date !== "" && time !== "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid || isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      // Create new appointment (Interconsulta)
      await appointmentService.createAppointment({
        patientId,
        doctorId: selectedDoctorId,
        date,
        time,
        patientName,
        type: "especialista",
        status: "pendiente",
        notes: reason
      });
      
      onReferralSuccess();
      setView("success");
    } catch (err) {
      console.error(err);
      alert("Error al crear la derivación.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelClick = () => {
    if (selectedDoctorId || reason) {
      setView("confirm-cancel");
    } else {
      onClose();
    }
  };

  const selectedDoctor = colleagues.find(c => c.id === selectedDoctorId);

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center z-50 bg-slate-900/40 backdrop-blur-sm" 
      onClick={() => {
        if (view === "form") handleCancelClick();
        else if (view === "success") onClose();
      }}
    >
      {view === "form" && (
        <div className="relative w-full mx-4 rounded-2xl bg-white shadow-2xl flex flex-col max-h-[90vh]" style={{ maxWidth: "520px", fontFamily: "'Inter', sans-serif" }} onClick={(e) => e.stopPropagation()}>
          
          <div className="flex items-center justify-between px-7 pt-7 pb-5 border-b border-slate-100 shrink-0">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-indigo-50">
                <UserPlus size={18} className="text-indigo-600" strokeWidth={2} />
              </div>
              <div>
                <div className="text-[11px] font-bold tracking-widest text-indigo-600 uppercase mb-0.5">Interconsulta</div>
                <h2 className="text-lg font-bold text-slate-900 leading-tight">Referir a Especialista</h2>
              </div>
            </div>
            <button onClick={handleCancelClick} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 transition-colors">
              <X size={18} strokeWidth={2} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="px-7 py-6 flex flex-col gap-5 overflow-y-auto">
            {/* Buscador de Especialista */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-slate-700">Especialista a referir</label>
              <div className="relative transition-all duration-300 ease-in-out">
                <button
                  type="button"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className={`w-full px-4 py-2.5 border-2 rounded-xl text-left text-sm font-medium transition-all flex items-center justify-between ${
                    isDropdownOpen || selectedDoctorId ? "border-indigo-600 bg-indigo-50/30" : "border-slate-200 bg-slate-50 hover:border-slate-300"
                  }`}
                >
                  <span className={selectedDoctorId ? "text-indigo-600 font-bold" : "text-slate-400"}>
                    {selectedDoctorId ? `Dr/Dra. ${selectedDoctor?.nombre} ${selectedDoctor?.apellido}` : "Seleccionar especialista..."}
                  </span>
                  <ChevronDown size={16} className={`text-slate-400 transition-transform ${isDropdownOpen ? "rotate-180" : ""}`} />
                </button>
                
                {isDropdownOpen && (
                  <div className="absolute top-[calc(100%+8px)] left-0 right-0 bg-white border border-slate-200 rounded-xl shadow-xl z-10 overflow-hidden flex flex-col">
                    <div className="p-2 border-b border-slate-100 bg-slate-50">
                      <div className="relative">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input 
                          type="text" 
                          placeholder="Buscar nombre..." 
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-indigo-600"
                          autoFocus
                        />
                      </div>
                    </div>
                    <div className="max-h-48 overflow-y-auto p-1">
                      {filteredColleagues.length === 0 ? (
                        <p className="text-center text-sm text-slate-500 py-4">No se encontraron especialistas.</p>
                      ) : (
                        filteredColleagues.map((c) => {
                          const isSelected = selectedDoctorId === c.id;
                          return (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => { setSelectedDoctorId(c.id); setIsDropdownOpen(false); }}
                              className={`w-full px-3 py-2.5 rounded-lg text-left text-sm flex items-center gap-3 transition-colors ${
                                isSelected ? "bg-indigo-50" : "hover:bg-slate-50"
                              }`}
                            >
                              {isSelected ? <CheckSquare size={16} className="text-indigo-600" /> : <Square size={16} className="text-slate-300" />}
                              <div className="flex-1">
                                <span className={`block ${isSelected ? "text-indigo-600 font-semibold" : "text-slate-700"}`}>Dr/Dra. {c.nombre} {c.apellido}</span>
                              </div>
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Fecha y Hora sugerida */}
            <div className="flex gap-4">
              <div className="flex-1 flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-slate-700 flex items-center gap-2"><CalendarIcon size={14} /> Fecha Sugerida</label>
                <input 
                  type="date" 
                  value={date} 
                  onChange={(e) => setDate(e.target.value)} 
                  className="w-full px-3 py-2 border-2 border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-indigo-600 transition-colors"
                  required
                />
              </div>
              <div className="flex-1 flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-slate-700 flex items-center gap-2"><Clock size={14} /> Hora</label>
                <input 
                  type="time" 
                  value={time} 
                  onChange={(e) => setTime(e.target.value)} 
                  className="w-full px-3 py-2 border-2 border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-indigo-600 transition-colors"
                  required
                />
              </div>
            </div>

            {/* Motivo de Interconsulta */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-slate-700">Motivo de la Derivación</label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={`¿Por qué estás refiriendo a ${patientName}? ¿Qué contexto necesita el especialista?`}
                rows={4}
                className="w-full px-3 py-2 border-2 border-slate-200 rounded-xl text-sm font-medium outline-none resize-none focus:border-indigo-600 transition-colors"
                required
              />
            </div>

            {/* Botones de Acción */}
            <div className="flex gap-3 pt-2 border-t border-slate-100 shrink-0">
              <button type="button" onClick={handleCancelClick} disabled={isSubmitting} className="flex-1 py-2.5 border-2 border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                Cancelar
              </button>
              <button type="submit" disabled={!isFormValid || isSubmitting} className="flex-[2] py-2.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-indigo-600 hover:bg-indigo-700">
                {isSubmitting ? (
                  <><Loader2 size={16} strokeWidth={2.5} className="animate-spin" /> Agendando...</>
                ) : (
                  <><UserPlus size={16} strokeWidth={2.5} /> Confirmar Interconsulta</>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Vistas de Confirmación y Éxito */}
      {view === "confirm-cancel" && (
        <div className="relative w-full mx-4 rounded-2xl bg-white shadow-2xl p-8 text-center" style={{ maxWidth: "360px", fontFamily: "'Inter', sans-serif" }} onClick={(e) => e.stopPropagation()}>
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle size={24} className="text-red-600" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">¿Cancelar derivación?</h3>
          <p className="text-sm text-slate-500 mb-6">Se perderán los datos introducidos.</p>
          <div className="flex flex-col gap-2">
            <button onClick={onClose} className="w-full py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm transition-colors">Sí, cancelar proceso</button>
            <button onClick={() => setView("form")} className="w-full py-2.5 rounded-xl border-2 border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-sm transition-colors">No, volver al formulario</button>
          </div>
        </div>
      )}

      {view === "success" && (
        <div className="relative w-full mx-4 rounded-2xl bg-white shadow-2xl p-8 text-center" style={{ maxWidth: "360px", fontFamily: "'Inter', sans-serif" }} onClick={(e) => e.stopPropagation()}>
          <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4 animate-bounce">
            <CheckCircle2 size={32} className="text-green-600" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">¡Interconsulta Agendada!</h3>
          <p className="text-sm text-slate-500 mb-4">Se ha referido a <strong>{patientName}</strong> al especialista exitosamente.</p>
          <p className="text-xs text-slate-400 font-medium">Cerrando automáticamente...</p>
        </div>
      )}
    </div>
  );
}

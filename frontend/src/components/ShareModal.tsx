import React, { useState, useEffect } from "react";
import { X, Shield, ChevronDown, CheckSquare, Square, Search, CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";
import { userService } from "../services/userService";

interface Props {
  onClose: () => void;
  patientName: string;
  onAssign: (assignments: { doctorId: string; reason: string }[]) => void;
}

type ModalView = "form" | "confirm-cancel" | "success";

export function ShareModal({ onClose, patientName, onAssign }: Props) {
  const [colleagues, setColleagues] = useState<Array<{ id: string; name: string; specialty: string }>>([]);
  const [loadingColleagues, setLoadingColleagues] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [view, setView] = useState<ModalView>("form");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // EFECTO 1: Bloqueo de Scroll de la página principal
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  // EFECTO 2: Observador seguro para el cierre automático
  useEffect(() => {
    if (view === "success") {
      const timer = setTimeout(() => {
        onClose();
      }, 2200); // 2.2 segundos de confirmación visual
      
      // Limpieza vital para evitar fugas de memoria
      return () => clearTimeout(timer);
    }
  }, [view, onClose]);

  // EFECTO 3: Cargar colegas desde la API al montar
  useEffect(() => {
    userService.getDoctors().then((docs) => {
      const mapped = docs.map((d) => ({
        id: d.id,
        name: `${d.nombre || ''} ${d.apellido || ''}`.trim() || d.email,
        specialty: 'Médico'
      }));
      setColleagues(mapped);
      setLoadingColleagues(false);
    }).catch(err => {
      console.error(err);
      setLoadingColleagues(false);
    });
  }, []);

  const filteredColleagues = colleagues.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.specialty.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) {
        const next = prev.filter((i) => i !== id);
        const newReasons = { ...reasons };
        delete newReasons[id];
        setReasons(newReasons);
        return next;
      }
      return [...prev, id];
    });
  };

  const handleReasonChange = (id: string, value: string) => {
    setReasons((prev) => ({ ...prev, [id]: value }));
  };

  const isFormValid = selectedIds.length > 0 && selectedIds.every((id) => reasons[id]?.trim().length > 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid || isSubmitting) return;
    
    setIsSubmitting(true);
    const assignments = selectedIds.map(id => {
      const doc = colleagues.find(c => c.id === id);
      return {
        doctorId: id,
        name: doc?.name || '',
        specialty: doc?.specialty || '',
        reason: reasons[id]
      };
    });

    // Simulando transacción de red
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      onAssign(assignments);
      setView("success");
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelClick = () => {
    if (selectedIds.length > 0) {
      setView("confirm-cancel");
    } else {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center z-50 bg-slate-900/40 backdrop-blur-sm" 
      onClick={() => {
        // Puerta de escape: Permite cerrar haciendo clic en el fondo gris
        if (view === "form") handleCancelClick();
        else if (view === "success") onClose();
      }}
    >
      {view === "form" && (
        <div className="relative w-full mx-4 rounded-2xl bg-white shadow-2xl flex flex-col max-h-[90vh]" style={{ maxWidth: "520px", fontFamily: "'Inter', sans-serif" }} onClick={(e) => e.stopPropagation()}>
          
          <div className="flex items-center justify-between px-7 pt-7 pb-5 border-b border-slate-100 shrink-0">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-blue-50">
                <Shield size={18} className="text-[#0B5394]" strokeWidth={2} />
              </div>
              <div>
                <div className="text-[11px] font-bold tracking-widest text-[#0B5394] uppercase mb-0.5">Gestión de Equipo</div>
                <h2 className="text-lg font-bold text-slate-900 leading-tight">Asignar Especialistas</h2>
              </div>
            </div>
            <button onClick={handleCancelClick} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 transition-colors">
              <X size={18} strokeWidth={2} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="px-7 py-6 flex flex-col gap-5 overflow-y-auto">
            {/* Buscador y Selección Múltiple */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-slate-700">Seleccionar Colegas (Múltiple)</label>
              
              <div className="relative transition-all duration-300 ease-in-out" style={{ marginBottom: isDropdownOpen ? '250px' : '0' }}>
                <button
                  type="button"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className={`w-full px-4 py-2.5 border-2 rounded-xl text-left text-sm font-medium transition-all flex items-center justify-between ${
                    isDropdownOpen || selectedIds.length > 0 ? "border-[#0B5394] bg-blue-50/30" : "border-slate-200 bg-slate-50 hover:border-slate-300"
                  }`}
                >
                  <span className={selectedIds.length > 0 ? "text-[#0B5394] font-bold" : "text-slate-400"}>
                    {selectedIds.length > 0 ? `${selectedIds.length} especialista(s) seleccionado(s)` : "Buscar en el directorio..."}
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
                          placeholder="Escribe un nombre o especialidad..." 
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-[#0B5394]"
                          autoFocus
                        />
                      </div>
                    </div>
                    <div className="max-h-48 overflow-y-auto p-1">
                      {filteredColleagues.length === 0 ? (
                        <p className="text-center text-sm text-slate-500 py-4">No se encontraron especialistas.</p>
                      ) : (
                        filteredColleagues.map((c) => {
                          const isSelected = selectedIds.includes(c.id);
                          return (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => toggleSelection(c.id)}
                              className={`w-full px-3 py-2.5 rounded-lg text-left text-sm flex items-center gap-3 transition-colors ${
                                isSelected ? "bg-blue-50" : "hover:bg-slate-50"
                              }`}
                            >
                              {isSelected ? <CheckSquare size={16} className="text-[#0B5394]" /> : <Square size={16} className="text-slate-300" />}
                              <div className="flex-1">
                                <span className={`block ${isSelected ? "text-[#0B5394] font-semibold" : "text-slate-700"}`}>{c.name}</span>
                                <span className="text-xs text-slate-400">{c.specialty}</span>
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

            {/* Motivos Dinámicos */}
            {selectedIds.length > 0 && (
              <div className="flex flex-col gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100 transition-all">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Motivos de Inclusión</h4>
                {selectedIds.map(id => {
                  const doc = colleagues.find(c => c.id === id);
                  return (
                    <div key={id} className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-slate-700">Para: {doc?.name} ({doc?.specialty})</label>
                      <textarea
                        value={reasons[id] || ""}
                        onChange={(e) => handleReasonChange(id, e.target.value)}
                        placeholder={`Especifica por qué ${doc?.name} debe evaluar a ${patientName}...`}
                        rows={2}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none resize-none focus:border-[#0B5394]"
                      />
                    </div>
                  );
                })}
              </div>
            )}

            {/* Botones de Acción */}
            <div className="flex gap-3 pt-2 border-t border-slate-100 shrink-0">
              <button type="button" onClick={handleCancelClick} disabled={isSubmitting} className="flex-1 py-2.5 border-2 border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                Cancelar
              </button>
              <button type="submit" disabled={!isFormValid || isSubmitting} className="flex-[2] py-2.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-[#0B5394] hover:bg-[#094074]">
                {isSubmitting ? (
                  <><Loader2 size={16} strokeWidth={2.5} className="animate-spin" /> Guardando...</>
                ) : (
                  <><Shield size={16} strokeWidth={2.5} /> Asignar Equipo</>
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
          <h3 className="text-lg font-bold text-slate-900 mb-2">¿Cancelar asignación?</h3>
          <p className="text-sm text-slate-500 mb-6">Se perderán los motivos redactados y los especialistas no serán notificados.</p>
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
          <h3 className="text-xl font-bold text-slate-900 mb-2">¡Equipo Actualizado!</h3>
          <p className="text-sm text-slate-500 mb-4">Los especialistas seleccionados han sido asignados al caso de <strong>{patientName}</strong>.</p>
          <p className="text-xs text-slate-400 font-medium">Cerrando automáticamente...</p>
        </div>
      )}
    </div>
  );
}
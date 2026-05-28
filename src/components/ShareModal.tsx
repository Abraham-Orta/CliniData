import { useState } from "react";
import { X, Shield, ChevronDown, UserCheck, CheckCircle2, AlertTriangle } from "lucide-react";

const COLLEAGUES = [
  { id: "1", name: "Dra. Sarah Mitchell", specialty: "Cardiología" },
  { id: "2", name: "Dr. James Okafor", specialty: "Neurología" },
  { id: "3", name: "Dra. Priya Sharma", specialty: "Medicina Interna" },
  { id: "4", name: "Dr. Carlos Reyes", specialty: "Oncología" },
  { id: "5", name: "Dra. Leila Andersen", specialty: "Radiología" },
];

interface Props {
  onClose: () => void;
  patientName: string;
}

type ModalView = "form" | "confirm-cancel" | "success";

export function ShareModal({ onClose, patientName }: Props) {
  const [selectedColleague, setSelectedColleague] = useState("");
  const [reason, setReason] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [view, setView] = useState<ModalView>("form");

  const selected = COLLEAGUES.find((c) => c.id === selectedColleague);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedColleague || !reason.trim()) return;
    
    // Cambiamos a la vista de éxito
    setView("success");
    
    // Cerramos el modal automáticamente después de 2.5 segundos
    setTimeout(() => {
      onClose();
    }, 2500);
  };

  const handleCancelClick = () => {
    if (selectedColleague || reason.trim()) {
      setView("confirm-cancel"); // Si ya escribió algo, pedimos confirmación
    } else {
      onClose(); // Si está vacío, cerramos directo
    }
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50"
      style={{ backgroundColor: "rgba(15, 23, 42, 0.4)", backdropFilter: "blur(4px)" }}
      onClick={() => view === "form" && handleCancelClick()}
    >
      {/* VISTA 1: FORMULARIO PRINCIPAL */}
      {view === "form" && (
        <div
          className="relative w-full mx-4 rounded-2xl bg-white shadow-2xl"
          style={{ maxWidth: "480px", fontFamily: "'Inter', sans-serif" }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between px-7 pt-7 pb-5 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-blue-50">
                <Shield size={18} className="text-[#0B5394]" strokeWidth={2} />
              </div>
              <div>
                <div className="text-[11px] font-bold tracking-widest text-[#0B5394] uppercase mb-0.5">CliniData Corporativo</div>
                <h2 className="text-lg font-bold text-slate-900 leading-tight">Compartir Caso Clínico</h2>
              </div>
            </div>
            <button onClick={handleCancelClick} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 transition-colors">
              <X size={18} strokeWidth={2} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="px-7 py-6 flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-slate-700">Seleccionar Colega</label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className={`w-full px-4 py-2.5 border-2 rounded-xl text-left text-sm font-medium transition-all flex items-center justify-between ${
                    isDropdownOpen ? "border-[#0B5394] bg-blue-50/30" : "border-slate-200 bg-slate-50 hover:border-slate-300"
                  }`}
                >
                  {selected ? (
                    <span className="flex items-center gap-2 text-slate-900">
                      <UserCheck size={16} className="text-[#0B5394]" />
                      {selected.name} <span className="text-slate-400 font-normal">· {selected.specialty}</span>
                    </span>
                  ) : (
                    <span className="text-slate-400">Buscar en el directorio...</span>
                  )}
                  <ChevronDown size={16} className={`text-slate-400 transition-transform ${isDropdownOpen ? "rotate-180" : ""}`} />
                </button>
                
                {isDropdownOpen && (
                  <div className="absolute top-[calc(100%+8px)] left-0 right-0 bg-white border border-slate-200 rounded-xl shadow-xl z-10 overflow-hidden">
                    {COLLEAGUES.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => { setSelectedColleague(c.id); setIsDropdownOpen(false); }}
                        className={`w-full px-4 py-3 text-left text-sm flex items-center justify-between transition-colors ${
                          selectedColleague === c.id ? "bg-blue-50 text-[#0B5394] font-semibold" : "text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        <span>{c.name}</span>
                        <span className="text-xs text-slate-400 font-normal">{c.specialty}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-slate-700">Motivo de la Interconsulta</label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={`Describe brevemente el motivo para transferir el historial de ${patientName}...`}
                rows={4}
                className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl bg-slate-50 text-sm text-slate-900 outline-none resize-none transition-all focus:border-[#0B5394] focus:bg-white"
              />
            </div>

            <div className="flex gap-3 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={handleCancelClick}
                className="flex-1 py-2.5 border-2 border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={!selectedColleague || !reason.trim()}
                className="flex-[2] py-2.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: !selectedColleague || !reason.trim() ? "#94A3B8" : "#0B5394" }}
              >
                <Shield size={16} strokeWidth={2.5} /> Transferencia Segura
              </button>
            </div>
            
            <p className="text-[11px] text-center text-slate-400 mt-[-5px]">
              Transferencia protegida con cifrado de extremo a extremo. Cumple con normativas HIPAA.
            </p>
          </form>
        </div>
      )}

      {/* VISTA 2: CONFIRMACIÓN DE CANCELACIÓN */}
      {view === "confirm-cancel" && (
        <div className="relative w-full mx-4 rounded-2xl bg-white shadow-2xl p-8 text-center" style={{ maxWidth: "360px", fontFamily: "'Inter', sans-serif" }} onClick={(e) => e.stopPropagation()}>
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle size={24} className="text-red-600" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">¿Cancelar transferencia?</h3>
          <p className="text-sm text-slate-500 mb-6">Los datos que has ingresado no se guardarán y el historial no será compartido.</p>
          <div className="flex flex-col gap-2">
            <button onClick={onClose} className="w-full py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm transition-colors">
              Sí, cancelar proceso
            </button>
            <button onClick={() => setView("form")} className="w-full py-2.5 rounded-xl border-2 border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-sm transition-colors">
              No, volver al formulario
            </button>
          </div>
        </div>
      )}

      {/* VISTA 3: ÉXITO */}
      {view === "success" && (
        <div className="relative w-full mx-4 rounded-2xl bg-white shadow-2xl p-8 text-center" style={{ maxWidth: "360px", fontFamily: "'Inter', sans-serif" }} onClick={(e) => e.stopPropagation()}>
          <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4 animate-bounce">
            <CheckCircle2 size={32} className="text-green-600" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">¡Transferencia Exitosa!</h3>
          <p className="text-sm text-slate-500 mb-1">El historial médico de <strong>{patientName}</strong> ha sido compartido de forma segura.</p>
          <p className="text-xs text-slate-400 mt-4 animate-pulse">Cerrando ventana automáticamente...</p>
        </div>
      )}
    </div>
  );
}
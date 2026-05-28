import { useState } from "react";
import { 
  User, Phone, MapPin, Droplets, AlertCircle, Edit3, 
  Calendar, Clock, ChevronRight, Pill, FileText, Activity, 
  Download, Plus, ArrowLeft, Share2
} from "lucide-react";
import { type Patient } from "./PatientCard";
import { ShareModal } from "./ShareModal";

// Tipos y Datos Simulados para la Línea de Tiempo
interface VisitRecord {
  id: string;
  date: string;
  dayOfWeek: string;
  time: string;
  doctorName: string;
  doctorSpecialty: string;
  diagnosis: string;
  notes: string;
  prescriptions: string[];
  visitType: "rutina" | "control" | "urgencia" | "especialista";
  side: "left" | "right";
}

const visitRecords: VisitRecord[] = [
  {
    id: "1", date: "18 May, 2026", dayOfWeek: "Lunes", time: "10:30 AM",
    doctorName: "Dr. A. Rojas", doctorSpecialty: "Medicina General",
    diagnosis: "Rinitis alérgica estacional con conjuntivitis leve.",
    notes: "El paciente reporta empeoramiento de los síntomas en las últimas 3 semanas. Se recomienda reducir la actividad al aire libre.",
    prescriptions: ["Cetirizina 10mg", "Fluticasona nasal", "Lágrimas artificiales"],
    visitType: "rutina", side: "left",
  },
  {
    id: "2", date: "2 Abr, 2026", dayOfWeek: "Jueves", time: "02:15 PM",
    doctorName: "Dra. P. Menon", doctorSpecialty: "Cardiología",
    diagnosis: "Hipertensión leve (Etapa 1). PA en reposo constantemente elevada a 138/88 mmHg.",
    notes: "Se aconsejan modificaciones en el estilo de vida: restricción de sodio a menos de 2g/día, 30 min de ejercicio aeróbico 5x/semana.",
    prescriptions: ["Amlodipina 5mg", "Lisinopril 10mg"],
    visitType: "especialista", side: "right",
  },
  {
    id: "3", date: "14 Feb, 2026", dayOfWeek: "Sábado", time: "09:00 AM",
    doctorName: "Dr. A. Rojas", doctorSpecialty: "Medicina General",
    diagnosis: "Infección aguda del tracto respiratorio superior (viral).",
    notes: "Etiología viral confirmada; no se indican antibióticos. Se aconseja hidratación adecuada y reposo. Volver si la fiebre persiste.",
    prescriptions: ["Acetaminofén 500mg PRN"],
    visitType: "urgencia", side: "left",
  }
];

const visitTypeConfig = {
  rutina: { label: "Rutina", bg: "#EEF4FB", color: "#0B5394" },
  control: { label: "Control", bg: "#F0FDF4", color: "#16A34A" },
  urgencia: { label: "Urgencia", bg: "#FEF2F2", color: "#DC2626" },
  especialista: { label: "Especialista", bg: "#FAF5FF", color: "#7C3AED" },
};

export function MedicalHistory({ patient, onBack }: { patient: Patient, onBack: () => void }) {
  const [activeFilter, setActiveFilter] = useState("Todos");
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const filterOptions = ["Todos", "Rutina", "Control", "Urgencia", "Especialista"];

  const filtered = visitRecords.filter((r) =>
    activeFilter === "Todos" ? true : r.visitType.toLowerCase() === activeFilter.toLowerCase()
  );

  return (
    <div className="min-h-screen w-full bg-[#F8FAFC]" style={{ fontFamily: "Inter, sans-serif" }}>
      
      {/* Cabecera y Botón Volver */}
      <header className="bg-[#0B5394] w-full px-8 py-4 shadow-md sticky top-0 z-20">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <button 
            onClick={onBack}
            className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          <span className="text-white text-lg font-bold tracking-tight">Directorio Clínico</span>
        </div>
      </header>

      {/* Migas de pan (Breadcrumb) */}
      <div className="max-w-4xl mx-auto px-4 pt-6 pb-2">
        <p className="text-sm font-medium text-slate-400">
          Pacientes <span className="text-slate-300 mx-1.5">/</span>
          {patient.name} <span className="text-slate-300 mx-1.5">/</span>
          <span className="text-[#0B5394] font-semibold">Historia Médica</span>
        </p>
      </div>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-20">
        {/* Perfil del Paciente Dinámico */}
        <div className="w-full rounded-2xl p-6 mb-8 bg-white shadow-sm border border-slate-100">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0 text-white text-xl font-bold" style={{ backgroundColor: patient.avatarColor }}>
                {patient.initials}
              </div>
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h2 className="text-xl font-bold text-slate-900">{patient.name}</h2>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700 uppercase tracking-wide">
                    {patient.status}
                  </span>
                </div>
                <div className="flex items-center gap-5 text-sm text-slate-500 font-medium">
                  <span>Edad: {patient.age} años</span>
                  <span className="flex items-center gap-1"><Phone size={13} />+58 (414) 012-3456</span>
                  <span className="flex items-center gap-1"><MapPin size={13} />Puerto Ordaz, VE</span>
                </div>
              </div>
            </div>
            <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-[#0B5394] text-white hover:bg-[#094074] transition-all">
              <Edit3 size={14} /> Editar Perfil
            </button>
          </div>

          <div className="mt-5 pt-5 grid grid-cols-3 gap-4 border-t border-slate-100">
            <div className="flex items-start gap-3 px-4 py-3.5 rounded-xl bg-red-50">
              <Droplets size={15} className="mt-0.5 text-red-600" />
              <div>
                <p className="text-xs font-medium text-slate-400 mb-0.5 uppercase tracking-wider">Tipo de Sangre</p>
                <p className="text-sm font-bold text-slate-800">O+</p>
              </div>
            </div>
            <div className="flex items-start gap-3 px-4 py-3.5 rounded-xl bg-amber-50">
              <AlertCircle size={15} className="mt-0.5 text-amber-600" />
              <div>
                <p className="text-xs font-medium text-slate-400 mb-0.5 uppercase tracking-wider">Alergias</p>
                <p className="text-sm font-bold text-slate-800">Penicilina</p>
              </div>
            </div>
            <div className="flex items-start gap-3 px-4 py-3.5 rounded-xl bg-blue-50">
              <User size={15} className="mt-0.5 text-[#0B5394]" />
              <div>
                <p className="text-xs font-medium text-slate-400 mb-0.5 uppercase tracking-wider">Médico Principal</p>
                <p className="text-sm font-bold text-slate-800">Dr. Rachel Kim</p>
              </div>
            </div>
          </div>
        </div>

        {/* Sección de la Línea de Tiempo */}
        <div>
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Activity size={18} className="text-[#0B5394]" />
                <h2 className="text-lg font-bold text-slate-900">Evolución Clínica</h2>
                <span className="px-2 py-0.5 rounded-md text-xs font-semibold bg-blue-50 text-[#0B5394] ml-1">
                  {visitRecords.length} visitas
                </span>
              </div>
              <p className="text-sm text-slate-400">Historial completo · ordenado cronológicamente</p>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 p-1 rounded-xl bg-white shadow-sm border border-slate-100">
                {filterOptions.map((f) => (
                  <button
                    key={f}
                    onClick={() => setActiveFilter(f)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      activeFilter === f ? "bg-[#0B5394] text-white" : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>

              {/*Exportar Caso*/}
              <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all">
                <Download size={14} /> Exportar
              </button>

              {/*Compartir Caso*/}
              <button onClick={() => setIsShareModalOpen(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-amber-50 text-amber-700 hover:bg-amber-100 transition-all border border-amber-200">
                <Share2 size={14} /> Compartir Caso
              </button>

              {/*Nueva Visita*/}  
              <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-[#0B5394] text-white hover:bg-[#094074] transition-all">
                <Plus size={15} /> Nueva Visita
              </button>
            </div>
          </div>

          <div className="relative">
            <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-px bg-slate-200 z-0" />
            
            <div className="relative flex justify-center mb-6">
              <span className="px-4 py-1.5 rounded-full text-xs font-bold bg-slate-50 border border-slate-200 text-slate-400 z-10">2026</span>
            </div>

            <div className="flex flex-col gap-6">
              {filtered.map((record) => {
                const typeConfig = visitTypeConfig[record.visitType];
                const isLeft = record.side === "left";
                
                return (
                  <div key={record.id} className={`flex items-start w-full ${isLeft ? "flex-row" : "flex-row-reverse"}`}>
                    <div className={`w-[calc(50%-2rem)] ${isLeft ? "pr-8" : "pl-8"}`}>
                      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <span className="px-2.5 py-1 rounded-lg text-xs font-bold inline-block mb-2" style={{ backgroundColor: typeConfig.bg, color: typeConfig.color }}>
                              {typeConfig.label}
                            </span>
                            <div className="flex items-center gap-2 mb-1 text-sm font-bold text-slate-800">
                              <Calendar size={13} className="text-slate-400" /> {record.dayOfWeek}, {record.date}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-slate-500">
                              <Clock size={13} className="text-slate-400" /> {record.time}
                            </div>
                          </div>
                          <ChevronRight size={18} className="text-slate-300 mt-1" />
                        </div>

                        <div className="h-px bg-slate-100 mb-4" />

                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-blue-50 text-[#0B5394] shrink-0">
                            <User size={15} />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-800">{record.doctorName}</p>
                            <p className="text-xs text-slate-500">{record.doctorSpecialty}</p>
                          </div>
                        </div>

                        <div className="rounded-xl px-4 py-3 bg-slate-50 border border-slate-100 mb-3">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Diagnóstico</p>
                          <p className="text-sm font-medium text-slate-700 leading-relaxed">{record.diagnosis}</p>
                        </div>
                        
                        <div className="rounded-xl px-4 py-3 bg-amber-50/50 border border-amber-100/50">
                          <div className="flex items-center gap-2 mb-1">
                            <FileText size={12} className="text-amber-600" />
                            <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest">Notas Clínicas</p>
                          </div>
                          <p className="text-sm text-amber-900/80 leading-relaxed">{record.notes}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-center w-16 shrink-0 z-10">
                      <div className="w-4 h-4 rounded-full border-4 border-white bg-[#0B5394] mt-6 ring-4 ring-blue-50" />
                    </div>
                    <div className="w-[calc(50%-2rem)]" />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </main>
      {/* Modal Superpuesto */}
      {isShareModalOpen && (
        <ShareModal 
          patientName={patient.name} 
          onClose={() => setIsShareModalOpen(false)} 
        />
      )}
    </div>
  );
}
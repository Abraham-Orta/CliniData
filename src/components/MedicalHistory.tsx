import { useState, useEffect } from "react";
import { 
  User, Phone, MapPin, Droplets, AlertCircle, Edit3, 
  Calendar, Clock, ChevronRight, Pill, FileText, Activity, 
  Download, Plus, ArrowLeft, Users, Trash2, ShieldAlert, ChevronDown
} from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { type Patient } from "./PatientCard";
import { ShareModal, COLLEAGUES } from "./ShareModal"; 

// --- Interfaces y Configuración ---
interface VisitRecord { 
  id: string; 
  date: string; 
  dayOfWeek: string; 
  time: string; 
  rawDate: string; 
  rawTime: string; 
  doctorName: string; 
  doctorSpecialty: string; 
  diagnosis: string; 
  notes: string; 
  prescriptions: string[]; 
  visitType: "rutina" | "control" | "urgencia" | "especialista"; 
}

const visitTypeConfig = { 
  rutina: { label: "Rutina", bg: "#EEF4FB", color: "#0B5394", value: "rutina" }, 
  control: { label: "Control", bg: "#F0FDF4", color: "#16A34A", value: "control" }, 
  urgencia: { label: "Urgencia", bg: "#FEF2F2", color: "#DC2626", value: "urgencia" }, 
  especialista: { label: "Especialista", bg: "#FAF5FF", color: "#7C3AED", value: "especialista" } 
};

// --- Datos Iniciales Simulados ---
const initialVisitRecords: VisitRecord[] = [
  { id: "1", date: "18 May, 2026", dayOfWeek: "Lunes", time: "10:30 AM", rawDate: "2026-05-18", rawTime: "10:30", doctorName: "Dr. A. Rojas", doctorSpecialty: "Medicina General", diagnosis: "Rinitis alérgica estacional con conjuntivitis leve.", notes: "El paciente reporta empeoramiento de los síntomas en las últimas 3 semanas.", prescriptions: ["Cetirizina 10mg", "Fluticasona nasal"], visitType: "rutina" },
  { id: "2", date: "2 Abr, 2026", dayOfWeek: "Jueves", time: "02:15 PM", rawDate: "2026-04-02", rawTime: "14:15", doctorName: "Dra. P. Menon", doctorSpecialty: "Cardiología", diagnosis: "Hipertensión leve (Etapa 1). PA en reposo constantemente elevada a 138/88 mmHg.", notes: "Se aconsejan modificaciones en el estilo de vida.", prescriptions: ["Amlodipina 5mg", "Lisinopril 10mg"], visitType: "especialista" }
];

const statusOptions = [{ value: "estable", label: "Estable" }, { value: "observacion", label: "En Observación" }, { value: "critico", label: "Crítico" }];
const bloodOptions = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const visitOptions = Object.values(visitTypeConfig);

interface TeamMember { id: string; name: string; specialty: string; isPrimary: boolean; reason?: string; }
const CURRENT_USER_NAME = "Dr. Rachel Kim"; 

export function MedicalHistory({ patient, onBack }: { patient: Patient, onBack: () => void }) {
  // Estados de Datos
  const [currentPatient, setCurrentPatient] = useState<Patient>(patient);
  const [visits, setVisits] = useState<VisitRecord[]>(initialVisitRecords);
  const [medicalTeam, setMedicalTeam] = useState<TeamMember[]>([{ id: "dr-rachel", name: CURRENT_USER_NAME, specialty: "Medicina Interna", isPrimary: true }]);
  
  // Estados de Interfaz
  const [activeFilter, setActiveFilter] = useState("Todos");
  
  // Estados de Modales
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [doctorToRemove, setDoctorToRemove] = useState<TeamMember | null>(null);
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [isBloodOpen, setIsBloodOpen] = useState(false);
  
  const [isVisitModalOpen, setIsVisitModalOpen] = useState(false);
  const [isVisitTypeOpen, setIsVisitTypeOpen] = useState(false);

  // Formularios
  const [editForm, setEditForm] = useState({ name: "", age: "", condition: "", status: "estable", phone: "", location: "", bloodType: "O+", allergies: "" });
  const [visitForm, setVisitForm] = useState({ id: "", visitType: "rutina", rawDate: "", rawTime: "", diagnosis: "", notes: "", prescriptions: "" });

  // === EFECTO MAESTRO PARA BLOQUEAR EL SCROLL ===
  useEffect(() => {
    if (isEditModalOpen || isShareModalOpen || isVisitModalOpen || doctorToRemove !== null) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => { document.body.style.overflow = "unset"; };
  }, [isEditModalOpen, isShareModalOpen, isVisitModalOpen, doctorToRemove]);

  const isCurrentUserPrimary = medicalTeam.find(doc => doc.isPrimary)?.name === CURRENT_USER_NAME;

  // --- LÓGICA DE EXPORTACIÓN PDF ---
  const handleExportPDF = () => {
    const doc = new jsPDF();
    let yPos = 20;

    // 1. Cabecera Institucional
    doc.setFontSize(22);
    doc.setTextColor(11, 83, 148); // #0B5394 (Azul de la app)
    doc.text("CliniData - Historia Médica", 14, yPos);
    
    doc.setFontSize(10);
    doc.setTextColor(150, 150, 150);
    const today = new Date().toLocaleDateString();
    doc.text(`Fecha de Emisión: ${today}`, 150, yPos);
    yPos += 15;

    // 2. Información Básica del Paciente
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "bold");
    doc.text(`Paciente: ${currentPatient.name}`, 14, yPos);
    yPos += 8;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Edad: ${currentPatient.age} años`, 14, yPos);
    doc.text(`Condición Principal: ${currentPatient.condition}`, 60, yPos);
    doc.text(`Estado: ${currentPatient.status.toUpperCase()}`, 150, yPos);
    yPos += 6;

    doc.text(`Teléfono: ${currentPatient.phone || "N/A"}`, 14, yPos);
    doc.text(`Ubicación: ${currentPatient.location || "N/A"}`, 60, yPos);
    yPos += 6;

    doc.text(`Tipo de Sangre: ${currentPatient.bloodType || "N/A"}`, 14, yPos);
    doc.text(`Alergias: ${currentPatient.allergies || "Ninguna"}`, 60, yPos);
    yPos += 12;

    // Línea separadora
    doc.setDrawColor(226, 232, 240);
    doc.line(14, yPos, 196, yPos);
    yPos += 10;

    // 3. Equipo Médico Asignado
    doc.setFontSize(14);
    doc.setTextColor(11, 83, 148);
    doc.setFont("helvetica", "bold");
    doc.text("Equipo Médico Asignado", 14, yPos);
    yPos += 4;

    const teamData = medicalTeam.map(doc => [
      doc.name + (doc.isPrimary ? " (Principal)" : ""),
      doc.specialty,
      doc.reason || "Médico Tratante"
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [['Especialista', 'Especialidad', 'Motivo de Asignación']],
      body: teamData,
      theme: 'grid',
      headStyles: { fillColor: [11, 83, 148], textColor: 255 },
      styles: { fontSize: 9, font: "helvetica" },
    });

    // @ts-ignore (El tipado estricto de autoTable requiere esto)
    yPos = doc.lastAutoTable.finalY + 15;

    // 4. Evolución Clínica (ORDENADA DE ANTIGUO A RECIENTE)
    doc.setFontSize(14);
    doc.setTextColor(11, 83, 148);
    doc.setFont("helvetica", "bold");
    doc.text("Evolución Clínica (Orden Cronológico)", 14, yPos);
    yPos += 4;

    // Clonamos y ordenamos ASCENDENTE (de menor a mayor timestamp)
    const chronologicalVisits = [...visits].sort((a, b) => {
      const dateA = new Date(`${a.rawDate}T${a.rawTime}`).getTime();
      const dateB = new Date(`${b.rawDate}T${b.rawTime}`).getTime();
      return dateA - dateB;
    });

    const visitsData = chronologicalVisits.map(v => [
      `${v.date}\n${v.time}`,
      `${v.doctorName}\n(${visitTypeConfig[v.visitType]?.label})`,
      v.diagnosis,
      v.prescriptions.length > 0 ? v.prescriptions.join(", ") : "Ninguna",
      v.notes || "N/A"
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [['Fecha y Hora', 'Atendido por', 'Diagnóstico', 'Prescripciones', 'Notas Adicionales']],
      body: visitsData,
      theme: 'striped',
      headStyles: { fillColor: [11, 83, 148] },
      styles: { fontSize: 9, cellPadding: 4, font: "helvetica" },
      columnStyles: {
        0: { cellWidth: 30 },
        1: { cellWidth: 35 },
        2: { cellWidth: 50 },
        3: { cellWidth: 35 },
        4: { cellWidth: 'auto' },
      }
    });

    // Descargar el archivo
    doc.save(`Historia_Clinica_${currentPatient.name.replace(/\s+/g, '_')}.pdf`);
  };

  // --- LÓGICA DE PERFIL ---
  const openProfileModal = () => {
    setEditForm({ name: currentPatient.name, age: currentPatient.age.toString(), condition: currentPatient.condition, status: currentPatient.status, phone: currentPatient.phone || "", location: currentPatient.location || "", bloodType: currentPatient.bloodType || "O+", allergies: currentPatient.allergies || "" });
    setIsStatusOpen(false); setIsBloodOpen(false); setIsEditModalOpen(true);
  };

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPatient({ ...currentPatient, name: editForm.name, age: parseInt(editForm.age) || currentPatient.age, condition: editForm.condition, status: editForm.status as any, phone: editForm.phone, location: editForm.location, bloodType: editForm.bloodType, allergies: editForm.allergies, initials: editForm.name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase() });
    setIsEditModalOpen(false);
  };

  // --- LÓGICA DE EQUIPO MÉDICO ---
  const handleAssignDoctors = (assignments: { doctorId: string; reason: string }[]) => {
    const newMembers = assignments.map(a => {
      const doc = COLLEAGUES.find(c => c.id === a.doctorId)!;
      return { id: doc.id, name: doc.name, specialty: doc.specialty, isPrimary: false, reason: a.reason };
    });
    setMedicalTeam(prev => {
      const filtered = prev.filter(p => !assignments.some(a => a.doctorId === p.id));
      return [...filtered, ...newMembers];
    });
  };

  const confirmRemoveDoctor = () => {
    if (doctorToRemove) {
      setMedicalTeam(prev => prev.filter(doc => doc.id !== doctorToRemove.id));
      setDoctorToRemove(null);
    }
  };

  // --- LÓGICA DE VISITAS CON ORDENAMIENTO CRONOLÓGICO PARA LA UI ---
  const openNewVisitModal = () => {
    setVisitForm({ id: "", visitType: "rutina", rawDate: "", rawTime: "", diagnosis: "", notes: "", prescriptions: "" });
    setIsVisitTypeOpen(false); setIsVisitModalOpen(true);
  };

  const openEditVisitModal = (record: VisitRecord) => {
    setVisitForm({ id: record.id, visitType: record.visitType, rawDate: record.rawDate, rawTime: record.rawTime, diagnosis: record.diagnosis, notes: record.notes, prescriptions: record.prescriptions.join(", ") });
    setIsVisitTypeOpen(false); setIsVisitModalOpen(true);
  };

  const handleVisitSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const d = new Date(visitForm.rawDate + 'T00:00:00');
    const days = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
    const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
    const dateStr = `${d.getDate()} ${months[d.getMonth()]}, ${d.getFullYear()}`;
    const dayStr = days[d.getDay()];

    let [h, m] = visitForm.rawTime.split(':');
    let hours = parseInt(h);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    const timeStr = `${hours}:${m} ${ampm}`;

    const rxArray = visitForm.prescriptions.split(',').map(s => s.trim()).filter(s => s);

    let updatedVisits;

    if (visitForm.id) {
      updatedVisits = visits.map(v => v.id === visitForm.id ? {
        ...v, rawDate: visitForm.rawDate, rawTime: visitForm.rawTime, date: dateStr, dayOfWeek: dayStr, time: timeStr, diagnosis: visitForm.diagnosis, notes: visitForm.notes, prescriptions: rxArray, visitType: visitForm.visitType as any
      } : v);
    } else {
      const newVisit: VisitRecord = {
        id: Date.now().toString(), rawDate: visitForm.rawDate, rawTime: visitForm.rawTime, date: dateStr, dayOfWeek: dayStr, time: timeStr, diagnosis: visitForm.diagnosis, notes: visitForm.notes, prescriptions: rxArray, visitType: visitForm.visitType as any, 
        doctorName: CURRENT_USER_NAME, 
        doctorSpecialty: "Medicina Interna"
      };
      updatedVisits = [newVisit, ...visits];
    }

    // Para la UI, ordenamos de la más reciente a la más antigua
    updatedVisits.sort((a, b) => {
      const dateA = new Date(`${a.rawDate}T${a.rawTime}`);
      const dateB = new Date(`${b.rawDate}T${b.rawTime}`);
      return dateB.getTime() - dateA.getTime();
    });

    setVisits(updatedVisits);
    setIsVisitModalOpen(false);
  };

  const filteredVisits = visits.filter((r) => activeFilter === "Todos" ? true : r.visitType.toLowerCase() === activeFilter.toLowerCase());
  const filterOptions = ["Todos", "Rutina", "Control", "Urgencia", "Especialista"];

  return (
    <div className="min-h-screen w-full bg-[#F8FAFC]" style={{ fontFamily: "Inter, sans-serif" }}>
      
      <header className="bg-[#0B5394] w-full px-8 py-4 shadow-md sticky top-0 z-20">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <button onClick={onBack} className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"><ArrowLeft size={18} /></button>
          <span className="text-white text-lg font-bold tracking-tight">Directorio Clínico</span>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 pt-6 pb-2">
        <p className="text-sm font-medium text-slate-400">Pacientes <span className="text-slate-300 mx-1.5">/</span>{currentPatient.name} <span className="text-slate-300 mx-1.5">/</span><span className="text-[#0B5394] font-semibold">Historia Médica</span></p>
      </div>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-20 flex flex-col gap-8">
        
        {/* PERFIL DEL PACIENTE */}
        <div className="w-full rounded-2xl p-6 bg-white shadow-sm border border-slate-100">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0 text-white text-xl font-bold shadow-inner" style={{ backgroundColor: currentPatient.avatarColor }}>{currentPatient.initials}</div>
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h2 className="text-xl font-bold text-slate-900">{currentPatient.name}</h2>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700 uppercase tracking-wide">{currentPatient.status}</span>
                </div>
                <div className="flex items-center gap-5 text-sm text-slate-500 font-medium">
                  <span>Edad: {currentPatient.age} años</span>
                  <span className="flex items-center gap-1"><Phone size={13} />{currentPatient.phone || "+58 (000) 000-0000"}</span>
                  <span className="flex items-center gap-1"><MapPin size={13} />{currentPatient.location || "Puerto Ordaz, VE"}</span>
                </div>
              </div>
            </div>
            <button onClick={openProfileModal} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-[#0B5394] text-white hover:bg-[#094074] transition-all"><Edit3 size={14} /> Editar Perfil</button>
          </div>
          <div className="mt-5 pt-5 grid grid-cols-2 gap-4 border-t border-slate-100">
            <div className="flex items-start gap-3 px-4 py-3.5 rounded-xl bg-red-50/50"><Droplets size={15} className="mt-0.5 text-red-600" /><div><p className="text-[11px] font-bold text-slate-400 mb-0.5 uppercase tracking-wider">Tipo de Sangre</p><p className="text-sm font-bold text-slate-800">{currentPatient.bloodType || "O+"}</p></div></div>
            <div className="flex items-start gap-3 px-4 py-3.5 rounded-xl bg-amber-50/50"><AlertCircle size={15} className="mt-0.5 text-amber-600" /><div><p className="text-[11px] font-bold text-slate-400 mb-0.5 uppercase tracking-wider">Alergias</p><p className="text-sm font-bold text-slate-800">{currentPatient.allergies || "Ninguna"}</p></div></div>
          </div>
        </div>

        {/* EQUIPO MÉDICO */}
        <div className="w-full rounded-2xl p-6 bg-white shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2"><Users size={18} className="text-[#0B5394]" /><h2 className="text-lg font-bold text-slate-900">Equipo Médico Asignado</h2><span className="px-2 py-0.5 rounded-md text-xs font-semibold bg-blue-50 text-[#0B5394] ml-2">{medicalTeam.length} Miembros</span></div>
            <button onClick={() => setIsShareModalOpen(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-amber-50 text-amber-700 hover:bg-amber-100 transition-all border border-amber-200"><Plus size={14} strokeWidth={2.5} /> Añadir Especialista</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {medicalTeam.map((doc) => (
              <div key={doc.id} className={`flex items-start justify-between p-4 rounded-xl border ${doc.isPrimary ? "bg-[#0B5394]/5 border-[#0B5394]/20" : "bg-slate-50 border-slate-100"}`}>
                <div className="flex gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${doc.isPrimary ? "bg-[#0B5394] text-white" : "bg-slate-200 text-slate-600"}`}><User size={18} /></div>
                  <div>
                    <div className="flex items-center gap-2"><p className="text-sm font-bold text-slate-900">{doc.name}</p>{doc.isPrimary && <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#0B5394] text-white uppercase tracking-wider">Principal</span>}</div>
                    <p className="text-xs font-medium text-slate-500 mb-1">{doc.specialty}</p>
                    {!doc.isPrimary && doc.reason && <p className="text-xs text-slate-400 italic">"{doc.reason}"</p>}
                  </div>
                </div>
                {!doc.isPrimary && isCurrentUserPrimary && <button onClick={() => setDoctorToRemove(doc)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Revocar acceso"><Trash2 size={16} /></button>}
              </div>
            ))}
          </div>
        </div>

        {/* LÍNEA DE TIEMPO */}
        <div>
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2 mb-1"><Activity size={18} className="text-[#0B5394]" /><h2 className="text-lg font-bold text-slate-900">Evolución Clínica</h2></div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 p-1 rounded-xl bg-white shadow-sm border border-slate-100">
                {filterOptions.map((f) => <button key={f} onClick={() => setActiveFilter(f)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${activeFilter === f ? "bg-[#0B5394] text-white" : "text-slate-500 hover:text-slate-700"}`}>{f}</button>)}
              </div>
              
              {/* BOTÓN DE EXPORTAR CONECTADO */}
              <button onClick={handleExportPDF} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all">
                <Download size={14} /> Exportar
              </button>
              
              <button onClick={openNewVisitModal} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-[#0B5394] text-white hover:bg-[#094074] transition-all shadow-sm"><Plus size={15} /> Nueva Visita</button>
            </div>
          </div>

          <div className="relative">
            <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-px bg-slate-200 z-0" />
            
            {filteredVisits.length > 0 && (
              <div className="relative flex justify-center mb-6">
                <span className="px-4 py-1.5 rounded-full text-xs font-bold bg-slate-50 border border-slate-200 text-slate-400 z-10">
                  {filteredVisits[0].rawDate.substring(0, 4)}
                </span>
              </div>
            )}

            <div className="flex flex-col gap-6">
              {filteredVisits.length === 0 ? (
                <div className="text-center py-8 text-sm text-slate-500 z-10 bg-white mx-auto px-6 rounded-xl border border-slate-100 shadow-sm">No hay visitas registradas para este filtro.</div>
              ) : (
                filteredVisits.map((record, index) => {
                  const typeConfig = visitTypeConfig[record.visitType];
                  const isLeft = index % 2 === 0;

                  const currentYear = record.rawDate.substring(0, 4);
                  const previousYear = index > 0 ? filteredVisits[index - 1].rawDate.substring(0, 4) : null;
                  const showYearLabel = index > 0 && currentYear !== previousYear;

                  return (
                    <div key={record.id} className="w-full flex flex-col">
                      
                      {showYearLabel && (
                        <div className="relative flex justify-center my-6">
                          <span className="px-4 py-1.5 rounded-full text-xs font-bold bg-slate-50 border border-slate-200 text-slate-400 z-10">
                            {currentYear}
                          </span>
                        </div>
                      )}

                      <div className={`flex items-start w-full ${isLeft ? "flex-row" : "flex-row-reverse"}`}>
                        <div className={`w-[calc(50%-2rem)] ${isLeft ? "pr-8" : "pl-8"}`}>
                          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow group">
                            <div className="flex items-start justify-between mb-4">
                              <div>
                                <span className="px-2.5 py-1 rounded-lg text-xs font-bold inline-block mb-2" style={{ backgroundColor: typeConfig.bg, color: typeConfig.color }}>{typeConfig.label}</span>
                                <div className="flex items-center gap-2 mb-1 text-sm font-bold text-slate-800"><Calendar size={13} className="text-slate-400" /> {record.dayOfWeek}, {record.date}</div>
                                <div className="flex items-center gap-2 text-sm text-slate-500"><Clock size={13} className="text-slate-400" /> {record.time}</div>
                              </div>
                              <button onClick={() => openEditVisitModal(record)} className="p-2 text-slate-400 hover:text-[#0B5394] hover:bg-blue-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100" title="Editar visita"><Edit3 size={18} /></button>
                            </div>
                            <div className="h-px bg-slate-100 mb-4" />
                            <div className="flex items-center gap-3 mb-4">
                              <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-blue-50 text-[#0B5394] shrink-0"><User size={15} /></div>
                              <div>
                                <p className="text-sm font-bold text-slate-800">{record.doctorName}</p>
                                <p className="text-xs text-slate-500">{record.doctorSpecialty}</p>
                              </div>
                            </div>
                            <div className="rounded-xl px-4 py-3 bg-slate-50 border border-slate-100 mb-3">
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Diagnóstico</p>
                              <p className="text-sm font-medium text-slate-700 leading-relaxed whitespace-pre-wrap">{record.diagnosis}</p>
                            </div>
                            {record.notes && (
                              <div className="rounded-xl px-4 py-3 bg-amber-50/50 border border-amber-100/50 mb-3">
                                <div className="flex items-center gap-2 mb-1"><FileText size={12} className="text-amber-600" /><p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest">Notas Clínicas</p></div>
                                <p className="text-sm text-amber-900/80 leading-relaxed whitespace-pre-wrap">{record.notes}</p>
                              </div>
                            )}
                            {record.prescriptions.length > 0 && (
                              <div>
                                <div className="flex items-center gap-2 mb-2"><Pill size={12} className="text-slate-400" /><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Prescripciones</p></div>
                                <div className="flex flex-wrap gap-2">{record.prescriptions.map((rx) => <span key={rx} className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-50 text-[#0B5394]">{rx}</span>)}</div>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col items-center w-16 shrink-0 z-10"><div className="w-4 h-4 rounded-full border-4 border-white bg-[#0B5394] mt-6 ring-4 ring-blue-50" /></div>
                        <div className="w-[calc(50%-2rem)]" />
                      </div>

                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </main>

      {/* ======================================= */}
      {/* ============ ZONA DE MODALES ========== */}
      {/* ======================================= */}

      {/* 1. Modal para Editar Perfil del Paciente */}
      {isEditModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-slate-900/40 backdrop-blur-sm p-4 overflow-y-auto" onClick={() => { setIsEditModalOpen(false); setIsStatusOpen(false); setIsBloodOpen(false); }}>
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl flex flex-col my-auto" onClick={e => { e.stopPropagation(); setIsStatusOpen(false); setIsBloodOpen(false); }}>
            <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-100 bg-[#0B5394] text-white rounded-t-2xl"><Edit3 size={20} /><h3 className="text-lg font-bold">Editar Perfil del Paciente</h3></div>
            <form onSubmit={handleProfileSubmit} className="p-6 flex flex-col gap-4">
              <div><label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Nombre Completo</label><input type="text" required value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-[#0B5394]" /></div>
              <div className="flex gap-4">
                <div className="w-1/3"><label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Edad</label><input type="number" required min="0" value={editForm.age} onChange={e => setEditForm({...editForm, age: e.target.value})} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-[#0B5394]" /></div>
                <div className="w-2/3"><label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Estado Inicial</label>
                  <div className="relative">
                    <button type="button" onClick={(e) => { e.stopPropagation(); setIsStatusOpen(!isStatusOpen); setIsBloodOpen(false); }} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-white flex justify-between items-center outline-none transition-colors" style={{ borderColor: isStatusOpen ? "#0B5394" : "#E2E8F0" }}>
                      <span className="text-slate-700 font-medium">{statusOptions.find(o => o.value === editForm.status)?.label}</span><ChevronDown size={14} className={`text-slate-400 transition-transform ${isStatusOpen ? "rotate-180" : ""}`} />
                    </button>
                    {isStatusOpen && (
                      <div className="absolute top-[calc(100%+4px)] left-0 right-0 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden">
                        {statusOptions.map(opt => <button key={opt.value} type="button" onClick={(e) => { e.stopPropagation(); setEditForm({...editForm, status: opt.value}); setIsStatusOpen(false); }} className={`w-full text-left px-4 py-3 text-sm transition-colors ${editForm.status === opt.value ? "bg-blue-50 text-[#0B5394] font-semibold" : "text-slate-700 hover:bg-slate-50"}`}>{opt.label}</button>)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-1/2"><label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Teléfono</label><input type="text" value={editForm.phone} onChange={e => setEditForm({...editForm, phone: e.target.value})} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-[#0B5394]" /></div>
                <div className="w-1/2"><label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Ubicación</label><input type="text" value={editForm.location} onChange={e => setEditForm({...editForm, location: e.target.value})} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-[#0B5394]" /></div>
              </div>
              <div className="flex gap-4">
                <div className="w-1/3"><label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Sangre</label>
                  <div className="relative">
                    <button type="button" onClick={(e) => { e.stopPropagation(); setIsBloodOpen(!isBloodOpen); setIsStatusOpen(false); }} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-white flex justify-between items-center outline-none transition-colors" style={{ borderColor: isBloodOpen ? "#0B5394" : "#E2E8F0" }}>
                      <span className="text-slate-700 font-medium">{editForm.bloodType}</span><ChevronDown size={14} className={`text-slate-400 transition-transform ${isBloodOpen ? "rotate-180" : ""}`} />
                    </button>
                    {isBloodOpen && (
                      <div className="absolute top-[calc(100%+4px)] left-0 right-0 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-y-auto max-h-48">
                        {bloodOptions.map(blood => <button key={blood} type="button" onClick={(e) => { e.stopPropagation(); setEditForm({...editForm, bloodType: blood}); setIsBloodOpen(false); }} className={`w-full text-left px-4 py-2 text-sm transition-colors ${editForm.bloodType === blood ? "bg-blue-50 text-[#0B5394] font-semibold" : "text-slate-700 hover:bg-slate-50"}`}>{blood}</button>)}
                      </div>
                    )}
                  </div>
                </div>
                <div className="w-2/3"><label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Alergias</label><input type="text" value={editForm.allergies} onChange={e => setEditForm({...editForm, allergies: e.target.value})} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-[#0B5394]" /></div>
              </div>
              <div><label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Condición Médica Principal</label><input type="text" required value={editForm.condition} onChange={e => setEditForm({...editForm, condition: e.target.value})} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-[#0B5394]" /></div>
              <div className="flex gap-3 mt-2 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setIsEditModalOpen(false)} className="flex-1 py-2.5 rounded-xl font-semibold text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors">Cancelar</button>
                <button type="submit" className="flex-1 py-2.5 rounded-xl font-bold text-white bg-[#0B5394] hover:bg-[#094074] transition-colors">Guardar Cambios</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Modal para Nueva/Editar Visita */}
      {isVisitModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-slate-900/40 backdrop-blur-sm p-4 overflow-y-auto" onClick={() => { setIsVisitModalOpen(false); setIsVisitTypeOpen(false); }}>
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl flex flex-col my-auto" onClick={e => { e.stopPropagation(); setIsVisitTypeOpen(false); }}>
            <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-100 bg-[#0B5394] text-white rounded-t-2xl">
              <Activity size={20} />
              <h3 className="text-lg font-bold">{visitForm.id ? "Editar Visita Clínica" : "Nueva Visita Clínica"}</h3>
            </div>
            <form onSubmit={handleVisitSubmit} className="p-6 flex flex-col gap-4">
              
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Tipo de Visita</label>
                <div className="relative">
                  <button type="button" onClick={(e) => { e.stopPropagation(); setIsVisitTypeOpen(!isVisitTypeOpen); }} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-white flex justify-between items-center outline-none transition-colors" style={{ borderColor: isVisitTypeOpen ? "#0B5394" : "#E2E8F0" }}>
                    <span className="text-slate-700 font-medium">{visitTypeConfig[visitForm.visitType as keyof typeof visitTypeConfig]?.label}</span><ChevronDown size={14} className={`text-slate-400 transition-transform ${isVisitTypeOpen ? "rotate-180" : ""}`} />
                  </button>
                  {isVisitTypeOpen && (
                    <div className="absolute top-[calc(100%+4px)] left-0 right-0 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden">
                      {visitOptions.map(opt => <button key={opt.value} type="button" onClick={(e) => { e.stopPropagation(); setVisitForm({...visitForm, visitType: opt.value}); setIsVisitTypeOpen(false); }} className={`w-full text-left px-4 py-3 text-sm transition-colors ${visitForm.visitType === opt.value ? "bg-blue-50 text-[#0B5394] font-semibold" : "text-slate-700 hover:bg-slate-50"}`}>{opt.label}</button>)}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-1/2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Fecha</label>
                  <input type="date" required value={visitForm.rawDate} onChange={e => setVisitForm({...visitForm, rawDate: e.target.value})} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-[#0B5394] cursor-pointer [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-100" />
                </div>
                <div className="w-1/2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Hora</label>
                  <input type="time" required value={visitForm.rawTime} onChange={e => setVisitForm({...visitForm, rawTime: e.target.value})} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-[#0B5394] cursor-pointer [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-100" />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Diagnóstico</label>
                <textarea required rows={2} value={visitForm.diagnosis} onChange={e => setVisitForm({...visitForm, diagnosis: e.target.value})} placeholder="Ej. Hipertensión leve. PA en reposo 138/88 mmHg." className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-[#0B5394] resize-none" />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Notas Clínicas</label>
                <textarea rows={3} value={visitForm.notes} onChange={e => setVisitForm({...visitForm, notes: e.target.value})} placeholder="Recomendaciones, observaciones, etc." className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-[#0B5394] resize-none" />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Prescripciones (Separadas por comas)</label>
                <input type="text" value={visitForm.prescriptions} onChange={e => setVisitForm({...visitForm, prescriptions: e.target.value})} placeholder="Ej. Amlodipina 5mg, Lisinopril 10mg" className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-[#0B5394]" />
              </div>
              
              <div className="flex gap-3 mt-2 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setIsVisitModalOpen(false)} className="flex-1 py-2.5 rounded-xl font-semibold text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors">Cancelar</button>
                <button type="submit" className="flex-1 py-2.5 rounded-xl font-bold text-white bg-[#0B5394] hover:bg-[#094074] transition-colors">{visitForm.id ? "Actualizar Visita" : "Guardar Visita"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Modales Anteriores (Compartir y Eliminar) */}
      {isShareModalOpen && <ShareModal patientName={currentPatient.name} onClose={() => setIsShareModalOpen(false)} onAssign={handleAssignDoctors} />}
      
      {doctorToRemove && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-slate-900/40 backdrop-blur-sm p-4" onClick={() => setDoctorToRemove(null)}>
          <div className="relative w-full mx-4 rounded-2xl bg-white shadow-2xl p-8 text-center" style={{ maxWidth: "360px" }} onClick={(e) => e.stopPropagation()}>
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4"><ShieldAlert size={24} className="text-red-600" /></div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Revocar Acceso</h3>
            <p className="text-sm text-slate-500 mb-6">¿Estás seguro de que deseas revocar el acceso del <strong>{doctorToRemove.name}</strong> al historial de este paciente?</p>
            <div className="flex flex-col gap-2">
              <button onClick={confirmRemoveDoctor} className="w-full py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm transition-colors">Sí, revocar acceso</button>
              <button onClick={() => setDoctorToRemove(null)} className="w-full py-2.5 rounded-xl border-2 border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-sm transition-colors">Cancelar</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
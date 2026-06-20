import { type Patient, type GlobalVisit, type Appointment, type SystemEvent, type ClinicConfig } from "../types";

const TODAY = new Date();
const offset = TODAY.getTimezoneOffset() * 60000;
export const TODAY_STR = new Date(TODAY.getTime() - offset).toISOString().split('T')[0];
const DAYS_ES = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const MONTHS_ES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
export const TODAY_FORMATTED = `${TODAY.getDate()} ${MONTHS_ES[TODAY.getMonth()]}, ${TODAY.getFullYear()}`;
export const TODAY_DAY_OF_WEEK = DAYS_ES[TODAY.getDay()];

export const mockDb = {
  config: {
    id: "config-1",
    clinicName: "CliniData",
    totalBeds: 50,
  } as ClinicConfig,

  patients: [
    { id: "1", name: "Eleanor Hartwell", age: 67, lastVisit: TODAY_FORMATTED, condition: "Hipertensión", status: "estable", initials: "EH", avatarColor: "#0B5394", teamCount: 1 },
    { id: "2", name: "Marcus Delgado", age: 52, lastVisit: TODAY_FORMATTED, condition: "Diabetes Tipo 2", status: "observacion", initials: "MD", avatarColor: "#047857", teamCount: 1 },
    { id: "3", name: "Sophie Chen", age: 34, lastVisit: TODAY_FORMATTED, condition: "Asma", status: "estable", initials: "SC", avatarColor: "#7C3AED", teamCount: 1 },
    { id: "4", name: "Thomas Kwan", age: 71, lastVisit: TODAY_FORMATTED, condition: "Fibrilación Auricular", status: "critico", initials: "TK", avatarColor: "#B45309", teamCount: 3 },
    { id: "s1", name: "Yusuf Al-Farsi", age: 55, lastVisit: TODAY_FORMATTED, condition: "Postoperatorio Cardíaco", status: "critico", initials: "YA", avatarColor: "#991B1B", teamCount: 4 },
    { id: "s2", name: "Clara Novak", age: 38, lastVisit: TODAY_FORMATTED, condition: "Lupus (LES)", status: "observacion", initials: "CN", avatarColor: "#5B21B6", teamCount: 2 },
  ] as Patient[],

  visits: [
    { id: "v1", patientId: "1", date: TODAY_FORMATTED, dayOfWeek: TODAY_DAY_OF_WEEK, time: "10:30 AM", rawDate: TODAY_STR, rawTime: "10:30", doctorName: "Dr. Rachel Kim", doctorSpecialty: "Medicina Interna", diagnosis: "Cuadro de Rinitis alérgica estacional. Empeoramiento de síntomas.", notes: "Requiere monitoreo continuo.", prescriptions: ["Cetirizina 10mg"], visitType: "rutina", isReadmission: false, isResolved: true },
    { id: "v2", patientId: "2", date: TODAY_FORMATTED, dayOfWeek: TODAY_DAY_OF_WEEK, time: "11:30 AM", rawDate: TODAY_STR, rawTime: "11:30", doctorName: "Dr. Rachel Kim", doctorSpecialty: "Medicina Interna", diagnosis: "Hiperglicemia", notes: "Ajuste de dosis.", prescriptions: ["Metformina"], visitType: "control", isReadmission: true, isResolved: false },
    { id: "v3", patientId: "3", date: TODAY_FORMATTED, dayOfWeek: TODAY_DAY_OF_WEEK, time: "14:00 PM", rawDate: TODAY_STR, rawTime: "14:00", doctorName: "Dr. Rachel Kim", doctorSpecialty: "Medicina Interna", diagnosis: "Asma controlada", notes: "Buen progreso.", prescriptions: ["Salbutamol SOS"], visitType: "rutina", isReadmission: false, isResolved: true },
    { id: "v4", patientId: "4", date: TODAY_FORMATTED, dayOfWeek: TODAY_DAY_OF_WEEK, time: "16:00 PM", rawDate: TODAY_STR, rawTime: "16:00", doctorName: "Dr. Carlos Ruiz", doctorSpecialty: "Cardiología", diagnosis: "Fibrilación Auricular reagudizada", notes: "Ingreso inmediato.", prescriptions: ["Amiodarona"], visitType: "urgencia", isReadmission: true, isResolved: false },
  ] as GlobalVisit[],

  appointments: [
    { id: "app-1", patientId: "3", date: TODAY_STR, time: "09:00 AM", patientName: "Sophie Chen", type: "rutina", status: "pendiente", notes: "Chequeo respiratorio mensual.", doctorId: "doc-1" },
    { id: "app-2", patientId: "2", date: TODAY_STR, time: "10:30 AM", patientName: "Marcus Delgado", type: "control", status: "completada", notes: "Trae resultados de laboratorio.", doctorId: "doc-1" },
    { id: "app-3", patientId: "4", date: TODAY_STR, time: "11:15 AM", patientName: "Thomas Kwan", type: "urgencia", status: "completada", notes: "Arritmia reportada.", doctorId: "doc-2" },
    { id: "app-4", patientId: "1", date: TODAY_STR, time: "13:00 PM", patientName: "Eleanor Hartwell", type: "rutina", status: "completada", notes: "Control mensual.", doctorId: "doc-1" },
  ] as Appointment[],

  events: [
    { id: "ev-1", type: "update", doctorName: "Dra. Sarah Mitchell", action: "actualizó el diagnóstico de", patientName: "Clara Novak", timeAgo: "Hace 2 horas", read: false, patientId: "s2" },
    { id: "ev-2", type: "assignment", doctorName: "Dr. Abraham Orta", action: "te incluyó en el equipo de", patientName: "Eleanor Hartwell", timeAgo: "Hace 3 horas", read: false, patientId: "1", targetUser: "Dr. Rachel Kim" },
    { id: "ev-3", type: "system", doctorName: "Sistema", action: "Mantenimiento de servidores programado para", patientName: "esta noche", timeAgo: "Ayer", read: true }
  ] as SystemEvent[],

  reportsCount: 24,
};

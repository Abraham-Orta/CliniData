import { type Appointment, type GlobalVisit, type Patient } from '../types';

const MONTHS_ES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

type ApiPatient = {
  id: string;
  nombre: string;
  apellido: string;
  fechaNacimiento?: string | null;
  genero?: string | null;
  telefono?: string | null;
  email?: string | null;
  creadoEn?: string;
};

type ApiAppointment = {
  id: string;
  pacienteId: string;
  medicoId: string;
  fechaHora: string;
  duracion?: number | null;
  tipo?: string | null;
  estado?: 'confirmada' | 'pendiente' | 'cancelada' | 'completada' | null;
  notas?: string | null;
};

type ApiConsulta = {
  id: string;
  pacienteId: string;
  fecha?: string;
  medico?: { nombre?: string; apellido?: string } | null;
  motivo?: string | null;
  observaciones?: string | null;
  tratamientos?: Array<{ medicamento?: string | null }> | null;
};

function calcAge(fechaNacimiento?: string | null): number {
  if (!fechaNacimiento) return 0;
  const birth = new Date(fechaNacimiento);
  if (Number.isNaN(birth.getTime())) return 0;

  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age > 0 ? age : 0;
}

function toUiDate(dateLike?: string): string {
  const d = dateLike ? new Date(dateLike) : new Date();
  const safe = Number.isNaN(d.getTime()) ? new Date() : d;
  return `${safe.getDate()} ${MONTHS_ES[safe.getMonth()]}, ${safe.getFullYear()}`;
}

function toIsoDate(dateLike: string): string {
  const d = new Date(dateLike);
  if (Number.isNaN(d.getTime())) return new Date().toISOString().split('T')[0];
  const offset = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - offset).toISOString().split('T')[0];
}

function toUiTime(dateLike: string): string {
  const d = new Date(dateLike);
  if (Number.isNaN(d.getTime())) return '09:00 AM';
  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const period = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  return `${hours}:${minutes} ${period}`;
}

function initials(fullName: string): string {
  return fullName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');
}

function colorFromId(id: string): string {
  const colors = ['#0B5394', '#047857', '#7C3AED', '#B45309', '#BE185D'];
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) | 0;
  return colors[Math.abs(hash) % colors.length];
}

export function apiPatientToUi(patient: ApiPatient): Patient {
  const fullName = `${patient.nombre || ''} ${patient.apellido || ''}`.trim();
  return {
    id: patient.id,
    name: fullName || 'Paciente sin nombre',
    age: calcAge(patient.fechaNacimiento),
    lastVisit: toUiDate(patient.creadoEn),
    condition: 'Sin diagnóstico registrado',
    status: 'estable',
    initials: initials(fullName || patient.id),
    avatarColor: colorFromId(patient.id),
    phone: patient.telefono || undefined,
    location: 'No especificada',
    bloodType: 'No registrado',
    allergies: 'No registradas',
    teamCount: 1
  };
}

export function apiAppointmentToUi(
  appointment: ApiAppointment,
  patientNameById: Record<string, string> = {}
): Appointment {
  return {
    id: appointment.id,
    patientId: appointment.pacienteId,
    date: toIsoDate(appointment.fechaHora),
    time: toUiTime(appointment.fechaHora),
    patientName: patientNameById[appointment.pacienteId] || 'Paciente',
    type: appointment.tipo || 'rutina',
    status: appointment.estado || 'pendiente',
    notes: appointment.notas || undefined,
    doctorId: appointment.medicoId
  };
}

export function uiAppointmentToApi(input: Omit<Appointment, 'id'>) {
  const [timePart, period] = (input.time || '09:00 AM').split(' ');
  let [h, m] = (timePart || '09:00').split(':');
  let hh = parseInt(h || '9', 10);
  const mm = parseInt(m || '0', 10);
  if (period === 'PM' && hh !== 12) hh += 12;
  if (period === 'AM' && hh === 12) hh = 0;

  const date = new Date(`${input.date}T00:00:00`);
  date.setHours(hh, mm, 0, 0);

  return {
    pacienteId: input.patientId,
    medicoId: input.doctorId,
    fechaHora: date.toISOString(),
    tipo: input.type,
    estado: input.status,
    notas: input.notes || null
  };
}

export function apiConsultaToVisit(consulta: ApiConsulta): GlobalVisit {
  const date = consulta.fecha || new Date().toISOString();
  const d = new Date(date);
  const safe = Number.isNaN(d.getTime()) ? new Date() : d;
  const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

  const doctorName = consulta.medico
    ? `${consulta.medico.nombre || 'Dr.'} ${consulta.medico.apellido || ''}`.trim()
    : 'Médico';

  return {
    id: consulta.id,
    patientId: consulta.pacienteId,
    date: toUiDate(safe.toISOString()),
    dayOfWeek: days[safe.getDay()],
    time: toUiTime(safe.toISOString()),
    rawDate: toIsoDate(safe.toISOString()),
    rawTime: `${String(safe.getHours()).padStart(2, '0')}:${String(safe.getMinutes()).padStart(2, '0')}`,
    doctorName,
    doctorSpecialty: 'Medicina',
    diagnosis: consulta.motivo || 'Consulta general',
    notes: consulta.observaciones || '',
    prescriptions: (consulta.tratamientos || []).map((t) => t.medicamento || '').filter(Boolean),
    visitType: 'control'
  };
}

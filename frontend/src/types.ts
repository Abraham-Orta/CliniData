// src/types.ts

export interface ClinicConfig {
  id: string;
  clinicName: string;
  totalBeds: number;
}

export interface Patient {
  id: string;
  name: string;
  age: number;
  lastVisit: string;
  condition: string;
  status: "estable" | "observacion" | "critico";
  initials: string;
  avatarColor: string;
  phone?: string;
  location?: string;
  bloodType?: string;
  allergies?: string;
  teamCount?: number;
}

export interface Appointment {
  id: string;
  patientId: string;
  time: string;
  date: string;
  patientName: string;
  type: string;
  status: "confirmada" | "pendiente" | "cancelada" | "completada";
  notes?: string;
  doctorId: string;
}

export interface WaitlistPatient {
  id: string;
  patientId: string;
  patientName: string;
  urgency: "alta" | "media" | "baja";
  requiredType: string;
  addedAt: string;
  doctorId: string;
}

export interface GlobalVisit {
  id: string;
  patientId: string;
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
  visitType: string;
  doctorId?: string;
  isReadmission?: boolean; // Added for advanced metrics
  isResolved?: boolean; // Added for advanced metrics
}

export interface SystemEvent {
  id: string;
  type: "update" | "assignment" | "system";
  doctorName: string;
  action: string;
  patientName: string;
  timeAgo: string;
  read: boolean;
  patientId?: string;
  targetUser?: string;
}

// Keeping aliases for backwards compatibility for now if needed, but going forward use standard types.
export type ExtendedPatient = Patient;
export type GlobalAppointment = Appointment;
export type VisitRecord = GlobalVisit;

export interface AuditLog {
  id: string;
  accion: string;
  detalles: string;
  ipAddress: string;
  fecha: string;
  usuario?: {
    id: string;
    nombre: string;
    email: string;
    rol: string;
  } | null;
}



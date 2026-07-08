export interface Patient {
  id: string;
  name: string;
  age: number;
  condition: string;
  status: 'crítico' | 'estable' | 'en_observación' | 'observacion' | 'critico' | string;
  location?: string;
  phone?: string;
  bloodType?: string;
  allergies?: string;
  initials: string;
  lastVisit?: string;
  avatarColor?: string;
}

export interface ExtendedPatient extends Patient {
  teamCount: number;
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
}

export interface GlobalAppointment {
  id: string;
  patientId: string;
  time: string;
  date: string;
  patientName: string;
  type: string;
  status: string;
  notes?: string;
}

export interface SystemEvent {
  id: string;
  type: "update" | "assignment" | "prescription" | "alert" | "system" | string;
  doctorName: string;
  action: string;
  patientName: string;
  timeAgo: string;
  read: boolean;
  patientId?: string;
  targetUser?: string;
}

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

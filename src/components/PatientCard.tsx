import { Calendar, ChevronRight } from "lucide-react";

export interface Patient {
  id: string;
  name: string;
  age: number;
  lastVisit: string;
  condition: string;
  status: "estable" | "observacion" | "critico";
  initials: string;
  avatarColor: string;
}

const statusConfig = {
  estable: { label: "Estable", bg: "#F0FDF4", color: "#16A34A" },
  observacion: { label: "Observación", bg: "#FFF7ED", color: "#EA580C" },
  critico: { label: "Crítico", bg: "#FFF1F2", color: "#E11D48" },
};

interface PatientCardProps {
  patient: Patient;
  onClick: (patient: Patient) => void;
}

export function PatientCard({ patient, onClick }: PatientCardProps) {
  const status = statusConfig[patient.status];

  return (
    <div
      onClick={() => onClick(patient)}
      className="bg-white rounded-lg p-5 cursor-pointer group transition-shadow"
      style={{
        boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",
        fontFamily: "Inter, sans-serif",
        border: "1px solid rgba(0,0,0,0.05)",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.boxShadow =
          "0 4px 12px rgba(11,83,148,0.1), 0 2px 4px rgba(0,0,0,0.04)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.boxShadow =
          "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)";
      }}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className="flex items-center justify-center w-10 h-10 rounded-full text-white shrink-0"
            style={{
              backgroundColor: patient.avatarColor,
              fontSize: "13px",
              fontWeight: 600,
            }}
          >
            {patient.initials}
          </div>
          <div>
            <p style={{ fontSize: "14px", fontWeight: 600, color: "#111827", lineHeight: 1.3 }}>
              {patient.name}
            </p>
            <p style={{ fontSize: "12px", fontWeight: 400, color: "#9ca3af", lineHeight: 1.4, marginTop: "1px" }}>
              {patient.condition}
            </p>
          </div>
        </div>
        <ChevronRight size={15} color="#d1d5db" className="mt-0.5 group-hover:text-blue-400 transition-colors" />
      </div>

      <div className="h-px bg-gray-50 mb-4" />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <p style={{ fontSize: "10px", fontWeight: 500, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Edad
            </p>
            <p style={{ fontSize: "14px", fontWeight: 600, color: "#374151", marginTop: "2px" }}>
              {patient.age}
            </p>
          </div>
          <div className="w-px h-6 bg-gray-100" />
          <div>
            <p style={{ fontSize: "10px", fontWeight: 500, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Última Visita
            </p>
            <div className="flex items-center gap-1 mt-0.5">
              <Calendar size={11} color="#9ca3af" />
              <p style={{ fontSize: "13px", fontWeight: 500, color: "#374151" }}>
                {patient.lastVisit}
              </p>
            </div>
          </div>
        </div>

        <span
          className="px-2.5 py-1 rounded"
          style={{ backgroundColor: status.bg, color: status.color, fontSize: "11px", fontWeight: 600 }}
        >
          {status.label}
        </span>
      </div>
    </div>
  );
}
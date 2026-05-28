import { LayoutDashboard, Users, FileText, Calendar, Activity, Settings, LogOut, Stethoscope } from "lucide-react";

interface NavItem {
  icon: React.ElementType;
  label: string;
  active?: boolean;
  badge?: number;
}

const navItems: NavItem[] = [
  { icon: LayoutDashboard, label: "Panel Principal" },
  { icon: Users, label: "Pacientes", active: true },
  { icon: FileText, label: "Reportes Médicos" },
  { icon: Calendar, label: "Agenda", badge: 3 },
  { icon: Activity, label: "Estadísticas" },
];

const bottomNavItems: NavItem[] = [
  { icon: Settings, label: "Configuración" },
  { icon: LogOut, label: "Cerrar Sesión" },
];

export function Sidebar({ onSettingsClick, onLogoutClick }: { onSettingsClick: () => void, onLogoutClick: () => void }) {
  return (
    <aside className="flex flex-col w-60 min-h-screen bg-white border-r border-gray-100 shrink-0" style={{ fontFamily: "Inter, sans-serif" }}>
      <div className="flex items-center gap-3 px-6 py-6 border-b border-gray-100">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg" style={{ backgroundColor: "#0B5394" }}>
          <Stethoscope size={16} color="white" strokeWidth={2} />
        </div>
        <span className="tracking-tight" style={{ fontSize: "17px", fontWeight: 700, color: "#0B5394", letterSpacing: "-0.3px" }}>
          CliniData
        </span>
      </div>

      <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-100">
        <div className="flex items-center justify-center w-9 h-9 rounded-full text-white shrink-0" style={{ backgroundColor: "#0B5394", fontSize: "13px", fontWeight: 600 }}>
          DR
        </div>
        <div className="min-w-0">
          <p style={{ fontSize: "13px", fontWeight: 600, color: "#1a202c", lineHeight: 1.3 }}>Dr. Rachel Kim</p>
          <p style={{ fontSize: "11px", fontWeight: 400, color: "#9ca3af", lineHeight: 1.3 }}>Medicina Interna</p>
        </div>
      </div>

      <div className="px-6 pt-5 pb-1">
        <span style={{ fontSize: "10px", fontWeight: 600, color: "#9ca3af", letterSpacing: "0.08em", textTransform: "uppercase" }}>
          Menú Principal
        </span>
      </div>

      <nav className="flex flex-col gap-0.5 px-3 flex-1">
        {navItems.map((item) => (
          <button key={item.label} className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg transition-colors text-left group" style={{ backgroundColor: item.active ? "#EBF2FA" : "transparent" }}>
            <item.icon size={16} strokeWidth={2} color={item.active ? "#0B5394" : "#9ca3af"} />
            <span style={{ fontSize: "13.5px", fontWeight: item.active ? 600 : 400, color: item.active ? "#0B5394" : "#4b5563" }}>
              {item.label}
            </span>
            {item.badge && (
              <span className="ml-auto flex items-center justify-center w-5 h-5 rounded-full text-white" style={{ backgroundColor: "#0B5394", fontSize: "10px", fontWeight: 600 }}>
                {item.badge}
              </span>
            )}
          </button>
        ))}
      </nav>

      {/*<div className="flex flex-col gap-0.5 px-3 pb-4 border-t border-gray-100 pt-3">
        {bottomNavItems.map((item) => (
          <button key={item.label} className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg transition-colors text-left">
            <item.icon size={16} strokeWidth={2} color="#9ca3af" />
            <span style={{ fontSize: "13.5px", fontWeight: 400, color: "#4b5563" }}>{item.label}</span>
          </button>
        ))}*/}
        {/* Bottom nav */}
      <div className="flex flex-col gap-0.5 px-3 pb-4 border-t border-gray-100 pt-3">
        <button
          onClick={onSettingsClick}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg transition-colors text-left hover:bg-slate-50"
        >
          <Settings size={16} strokeWidth={2} color="#9ca3af" />
          <span style={{ fontSize: "13.5px", fontWeight: 400, color: "#4b5563" }}>Configuración</span>
        </button>
        
        <button
          onClick={onLogoutClick}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg transition-colors text-left hover:bg-red-50 group"
        >
          <LogOut size={16} strokeWidth={2} className="text-slate-400 group-hover:text-red-500 transition-colors" />
          <span className="group-hover:text-red-600 transition-colors" style={{ fontSize: "13.5px", fontWeight: 400, color: "#4b5563" }}>
            Cerrar Sesión
          </span>
        </button>
      </div>
    </aside>
  );
}
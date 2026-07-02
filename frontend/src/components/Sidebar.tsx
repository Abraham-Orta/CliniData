import { useLocation } from "react-router-dom";
import { LayoutGrid, Users, FileText, Calendar, TrendingUp, Settings, LogOut } from "lucide-react";
import { useAuth } from "../context/AuthContext";

interface SidebarProps {
  onNavigate: (view: string) => void;
  onSettingsClick: () => void;
  onLogoutClick: () => void;
  onProfileClick?: () => void;
}

export function Sidebar({ onNavigate, onSettingsClick, onLogoutClick, onProfileClick }: SidebarProps) {
  const location = useLocation();
  const currentPath = location.pathname.split("/")[1] || "dashboard";
  const { user } = useAuth();

  const mainMenuItems = [
    { id: "dashboard", label: "Panel Principal", icon: LayoutGrid },
    { id: "patients", label: "Pacientes", icon: Users },
    { id: "reports", label: "Estadísticas", icon: TrendingUp },
    { id: "agenda", label: "Agenda", icon: Calendar },
  ];

  const initials = user?.name ? user.name.slice(0, 2).toUpperCase() : 'U';
  const fullName = user?.name || 'Usuario';
  const roleName = user?.role === 'admin' ? 'Administrador' : 'Médico';

  return (
    <aside className="w-64 bg-white border-r border-slate-100 flex flex-col h-full shrink-0">
      {/* BRAND - NUEVO LOGO ESTILO LOGIN */}
      <div className="flex items-center gap-3 px-6 py-6 border-b border-slate-100">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-md bg-[#0B5394]">
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
            <rect x="9" y="2" width="4" height="18" rx="2" fill="white" />
            <rect x="2" y="9" width="18" height="4" rx="2" fill="white" />
          </svg>
        </div>
        <span className="text-[22px] font-bold text-[#0B5394] tracking-tight" style={{ letterSpacing: "-0.02em" }}>CliniData</span>
      </div>

      {/* USER PROFILE */}
      <button onClick={onProfileClick} className="px-6 py-6 border-b border-slate-100 hover:bg-slate-50 transition-colors w-full text-left focus:outline-none">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#0B5394] to-[#0E7490] flex items-center justify-center text-white font-bold shadow-sm shrink-0 transition-transform transform hover:scale-105">
            {initials}
          </div>
          <div className="overflow-hidden">
            <h3 className="text-sm font-bold text-slate-900 truncate">{fullName}</h3>
            <p className="text-xs font-medium text-slate-500 truncate">{roleName}</p>
          </div>
        </div>
      </button>

      {/* NAVIGATION */}
      <div className="flex-1 overflow-y-auto py-6">
        <div className="px-4 mb-2">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2">Menú Principal</span>
        </div>
        <nav className="flex flex-col gap-1 px-4">
          {mainMenuItems.map((item) => {
            const isActive = currentPath === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl transition-all ${
                  isActive 
                    ? "bg-gradient-to-r from-blue-50 to-cyan-50 text-[#0B5394] font-bold shadow-sm border border-blue-100/50" 
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-700 font-medium"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                  <span className="text-sm">{item.label}</span>
                </div>
                {item.badge && (
                  <span className={`w-5 h-5 flex items-center justify-center rounded-full text-[10px] font-bold ${
                    isActive ? "bg-[#0E7490] text-white shadow-sm" : "bg-slate-200 text-slate-600"
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* BOTTOM ACTIONS */}
      <div className="p-4 border-t border-slate-100 flex flex-col gap-1">
        <button onClick={onSettingsClick} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-500 hover:bg-slate-50 hover:text-slate-700 font-medium transition-all">
          <Settings size={18} strokeWidth={2} />
          <span className="text-sm">Configuración</span>
        </button>
        <button onClick={onLogoutClick} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-500 hover:bg-red-50 hover:text-red-600 font-medium transition-all">
          <LogOut size={18} strokeWidth={2} />
          <span className="text-sm">Cerrar Sesión</span>
        </button>
      </div>
    </aside>
  );
}
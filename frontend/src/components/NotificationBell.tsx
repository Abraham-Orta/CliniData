import { useState } from "react";
import { Bell, UserPlus, AlertTriangle, Activity, Info, CheckCircle2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export function NotificationBell({ globalState, onPatientSelect }: any) {
  const { events, setEvents, patients } = globalState;
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuth();

  const doctorFullName = user?.name ? `Dr. ${user.name}` : 'Dr. Usuario';

  // NOTIFICACIONES: Solo alertas y asignaciones dirigidas directamente al médico actual
  const userNotifications = events.filter((e: any) => e.targetUser === doctorFullName);
  const unreadCount = userNotifications.filter((e: any) => !e.read).length;

  const markAllAsRead = () => {
    setEvents(events.map((e: any) => e.targetUser === doctorFullName ? { ...e, read: true } : e));
  };

  const handleNotificationClick = (notif: any) => {
    if (!notif.read) {
      setEvents(events.map((e: any) => e.id === notif.id ? { ...e, read: true } : e));
    }
    if (notif.patientId && onPatientSelect) {
      const targetPatient = patients.find((p: any) => p.id === notif.patientId);
      if (targetPatient) { 
        setIsOpen(false); 
        onPatientSelect(targetPatient); 
      }
    }
  };

  return (
    <div className="relative">
      <button onClick={() => setIsOpen(!isOpen)} className={`relative p-2 rounded-xl transition-all ${isOpen ? "bg-cyan-50 text-[#0E7490]" : "text-slate-400 hover:bg-slate-50 hover:text-slate-700"}`}>
        <Bell size={20} strokeWidth={2} />
        {unreadCount > 0 && <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-gradient-to-r from-red-500 to-rose-500 rounded-full border-2 border-white animate-pulse"></span>}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>
          <div className="absolute right-0 top-[calc(100%+8px)] w-80 bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 overflow-hidden flex flex-col transform origin-top-right transition-all">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-sm font-bold text-slate-800">Notificaciones</h3>
              {unreadCount > 0 && <button onClick={markAllAsRead} className="text-xs font-semibold text-[#0E7490] hover:text-[#0B5394]">Marcar leídas</button>}
            </div>
            <div className="max-h-96 overflow-y-auto">
              {userNotifications.length === 0 ? (
                <div className="py-8 text-center text-slate-500 text-sm">No tienes notificaciones nuevas.</div>
              ) : (
                userNotifications.map((notif: any) => (
                  <div key={notif.id} onClick={() => handleNotificationClick(notif)} className={`p-4 border-b border-slate-50 transition-colors ${!notif.read ? "bg-cyan-50/30" : ""} ${notif.patientId && onPatientSelect ? "cursor-pointer hover:bg-slate-50" : "cursor-default"}`}>
                    <div className="flex gap-3">
                      <div className="mt-0.5 shrink-0">
                        {notif.type === "assignment" && <UserPlus size={16} className="text-[#0E7490]" />}
                        {notif.type === "alert" && <AlertTriangle size={16} className="text-red-500" />}
                        {notif.type === "update" && <Activity size={16} className="text-amber-500" />}
                        {notif.type === "system" && <Info size={16} className="text-slate-400" />}
                        {notif.type === "prescription" && <CheckCircle2 size={16} className="text-emerald-500" />}
                      </div>
                      <div className="flex-1">
                        <p className={`text-sm ${!notif.read ? "font-bold text-slate-900" : "font-medium text-slate-700"}`}>
                          {notif.doctorName} {notif.action} <span className="font-bold text-[#0E7490]">{notif.patientName}</span>
                        </p>
                        <p className="text-[10px] font-semibold text-slate-400 mt-2 uppercase tracking-wider">{notif.timeAgo}</p>
                      </div>
                      {!notif.read && <div className="w-2 h-2 rounded-full bg-gradient-to-r from-[#0B5394] to-[#0E7490] mt-1.5 shrink-0 shadow-sm"></div>}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

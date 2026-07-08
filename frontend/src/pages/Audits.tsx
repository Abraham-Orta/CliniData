import React, { useState, useEffect } from "react";
import { 
  ShieldAlert, Search, RefreshCw, ChevronLeft, ChevronRight, 
  User, Calendar, Monitor, AlertTriangle, CheckCircle, Info
} from "lucide-react";
import { Sidebar } from "../components/Sidebar";
import { NotificationBell } from "../components/NotificationBell";
import { useApi } from "../hooks/useApi";
import { useAuth } from "../context/AuthContext";
import { auditService } from "../services/auditService";
import { AuditLog } from "../types";

export function Audits({ globalState, onNavigate, onLogout, onSettings, onProfile }: any) {
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const limit = 15;

  const { isLoading, error, execute } = useApi(async () => {
    const res = await auditService.getAudits(page, limit);
    setLogs(res.data);
    setTotalPages(res.meta.totalPages);
    setTotalItems(res.meta.total);
  });

  useEffect(() => {
    execute();
  }, [page]);

  const handleRefresh = () => {
    execute();
  };

  // Filtrado local reactivo de logs (por médico o acción o paciente)
  const filteredLogs = logs.filter(log => {
    const term = searchQuery.toLowerCase();
    const actionMatch = log.accion.toLowerCase().includes(term);
    const detailsMatch = log.detalles?.toLowerCase().includes(term) || false;
    const doctorMatch = log.usuario 
      ? `${log.usuario.nombre} ${log.usuario.email}`.toLowerCase().includes(term)
      : false;
    return actionMatch || detailsMatch || doctorMatch;
  });

  const getActionBadge = (action: string) => {
    if (action.includes('BLOQUEADO') || action.includes('RECHAZADO') || action.includes('FALLIDO')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 border border-rose-100 text-rose-700">
          <AlertTriangle size={12} className="shrink-0" />
          {action}
        </span>
      );
    }
    if (action.includes('CREAR') || action.includes('ACTUALIZAR') || action.includes('ELIMINAR')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 border border-amber-100 text-amber-700">
          <Info size={12} className="shrink-0" />
          {action}
        </span>
      );
    }
    if (action.includes('AUTORIZADO') || action.includes('SESION') || action.includes('REGISTRO')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 border border-emerald-100 text-emerald-700">
          <CheckCircle size={12} className="shrink-0" />
          {action}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-50 border border-slate-100 text-slate-700">
        <Info size={12} className="shrink-0" />
        {action}
      </span>
    );
  };

  const formatDate = (isoString: string) => {
    const d = new Date(isoString);
    return d.toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      <Sidebar 
        onNavigate={onNavigate} 
        onSettingsClick={onSettings} 
        onLogoutClick={onLogout} 
        onProfileClick={onProfile} 
      />

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* HEADER */}
        <header className="bg-white border-b border-slate-100 px-8 py-5 shrink-0 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
              <ShieldAlert className="text-[#0B5394]" size={24} />
              Bitácora de Auditoría
            </h1>
            <p className="text-xs font-medium text-slate-400 mt-1">
              Registro inalterable de accesos y operaciones críticas del sistema
            </p>
          </div>
          <div className="flex items-center gap-4">
            <NotificationBell globalState={globalState} />
          </div>
        </header>

        {/* CONTENT */}
        <div className="flex-1 overflow-y-auto p-8 space-y-6">
          {/* SEARCH & FILTERS BAR */}
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:w-96">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Search size={18} />
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por médico, acción o paciente..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-[#0B5394] transition-all text-sm font-medium placeholder-slate-400"
              />
            </div>
            <div className="flex items-center gap-3 w-full md:w-auto shrink-0 justify-end">
              <button 
                onClick={handleRefresh}
                className="p-2.5 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 active:scale-95 transition-all"
                title="Actualizar tabla"
              >
                <RefreshCw size={18} className={isLoading ? "animate-spin" : ""} />
              </button>
            </div>
          </div>

          {/* TABLE CONTAINER */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/75 border-b border-slate-100">
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Fecha y Hora</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Acción / Evento</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Usuario / Médico</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Dirección IP</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Detalles</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {isLoading ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-sm font-medium text-slate-400">
                        <RefreshCw className="animate-spin inline mr-2 text-[#0B5394]" size={18} />
                        Cargando logs de auditoría...
                      </td>
                    </tr>
                  ) : filteredLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-sm font-medium text-slate-400">
                        No se encontraron registros de auditoría.
                      </td>
                    </tr>
                  ) : (
                    filteredLogs.map((log) => (
                      <tr 
                        key={log.id} 
                        className={`hover:bg-slate-50/50 transition-colors ${
                          log.accion.includes('RECHAZADO') || log.accion.includes('BLOQUEADO') 
                            ? 'bg-rose-50/10' 
                            : ''
                        }`}
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-600">
                          <div className="flex items-center gap-2">
                            <Calendar size={14} className="text-slate-400 shrink-0" />
                            {formatDate(log.fecha)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getActionBadge(log.accion)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {log.usuario ? (
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#0B5394] to-[#0E7490] flex items-center justify-center text-white text-xs font-bold shadow-sm shrink-0">
                                {log.usuario.nombre.slice(0,2).toUpperCase()}
                              </div>
                              <div>
                                <div className="text-sm font-bold text-slate-800">{log.usuario.nombre}</div>
                                <div className="text-[11px] font-medium text-slate-400">{log.usuario.email} | {log.usuario.rol}</div>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-sm font-semibold text-slate-400">
                              <User size={14} />
                              Sistema / Anónimo
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-500">
                          <div className="flex items-center gap-2">
                            <Monitor size={14} className="text-slate-400 shrink-0" />
                            {log.ipAddress}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-slate-600 max-w-xs truncate" title={log.detalles}>
                          {log.detalles || '-'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* PAGINATION */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between shrink-0">
              <span className="text-xs font-bold text-slate-400">
                Mostrando {filteredLogs.length} de {totalItems} registros
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(p - 1, 1))}
                  disabled={page === 1 || isLoading}
                  className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="text-xs font-bold text-slate-600 px-2">
                  Página {page} de {totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(p + 1, totalPages))}
                  disabled={page === totalPages || isLoading}
                  className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

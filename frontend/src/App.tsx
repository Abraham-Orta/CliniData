import { useState, useEffect, useContext } from "react";
import { Routes, Route, Navigate, useNavigate, useLocation, useParams } from "react-router-dom";
import { Dashboard } from "./Dashboard";
import { PatientHub } from "./PatientHub";
import { Agenda } from "./Agenda";
import { Reports } from "./Reports";
import { LoginCard } from "./LoginCard"; 
import { MedicalHistory } from "./components/MedicalHistory"; 
import { AlertTriangle, X, Shield, Bell, Loader2 } from "lucide-react"; 
import { AppContext } from "./context/AppContext";
import { useAuth } from "./context/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";



import { patientService } from "./services/patientService";
import { useApi } from "./hooks/useApi";

function MedicalHistoryWrapper({ globalState, onBack }: any) {
  const { id } = useParams();
  const location = useLocation();
  const focusSection = location.state?.focusSection;
  
  const { data: patient, isLoading, error, execute } = useApi(async () => {
    return await patientService.getPatientById(id as string);
  });

  useEffect(() => {
    if (id) execute();
  }, [id]);
  
  if (isLoading) return <div className="p-8 flex items-center gap-2"><Loader2 className="animate-spin" /> Cargando paciente...</div>;
  if (error || !patient) return <div className="p-8">Paciente no encontrado</div>;
  
  return <MedicalHistory globalState={globalState} patient={patient} onBack={onBack} focusSection={focusSection} />;
}

export default function App() {
  const globalState = useContext(AppContext);
  const { logout, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isLogoutOpen, setIsLogoutOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  useEffect(() => {
    if (isSettingsOpen || isLogoutOpen || isProfileOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "unset";
  }, [isSettingsOpen, isLogoutOpen, isProfileOpen]);

  // Hooking into globalState navigation logic
  const handleNavigate = (view: string) => navigate(`/${view}`);
  const handleLogoutRequest = () => setIsLogoutOpen(true); 
  const handleSettingsRequest = () => setIsSettingsOpen(true);
  const handleProfileRequest = () => setIsProfileOpen(true);
  
  const confirmLogout = async () => { 
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      setIsLogoutOpen(false); 
      logout();
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleSaveSettings = async () => {
    if (isSavingSettings) return;
    setIsSavingSettings(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      setIsSettingsOpen(false);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSavingSettings(false);
    }
  };

  globalState.handlePatientSelect = (patient: any, focusSection?: string) => { 
    navigate(`/patients/${patient.id}/history`, { state: { focusSection } }); 
  };
  globalState.handleStartConsultation = (appointment: any, patientId: string) => {
    globalState.setActiveAppointment(appointment);
    navigate(`/patients/${patientId}/history`);
  };

  return (
    <>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginCard />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard globalState={globalState} onNavigate={handleNavigate} onLogout={handleLogoutRequest} onSettings={handleSettingsRequest} onProfile={handleProfileRequest} /></ProtectedRoute>} />
        <Route path="/patients" element={<ProtectedRoute><PatientHub globalState={globalState} onNavigate={handleNavigate} onPatientSelect={globalState.handlePatientSelect} onLogout={handleLogoutRequest} onSettings={handleSettingsRequest} onProfile={handleProfileRequest} /></ProtectedRoute>} />
        <Route path="/patients/:id/history" element={<ProtectedRoute><MedicalHistoryWrapper globalState={globalState} onBack={() => navigate('/patients')} /></ProtectedRoute>} />
        <Route path="/agenda" element={<ProtectedRoute><Agenda globalState={globalState} onNavigate={handleNavigate} onLogout={handleLogoutRequest} onSettings={handleSettingsRequest} onProfile={handleProfileRequest} /></ProtectedRoute>} />
        
        {/* Constructing view catch-all */}
        <Route path="/reports" element={<ProtectedRoute><Reports globalState={globalState} onNavigate={handleNavigate} onLogout={handleLogoutRequest} onSettings={handleSettingsRequest} onProfile={handleProfileRequest} /></ProtectedRoute>} />
      </Routes>

      {/* MODALS */}
      {isLogoutOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-[100] bg-slate-900/40 backdrop-blur-sm p-4" onClick={() => setIsLogoutOpen(false)}>
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl p-6 text-center" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4"><AlertTriangle size={24} className="text-red-500" /></div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">¿Cerrar Sesión?</h3>
            <p className="text-sm text-slate-500 mb-6">Tendrás que volver a ingresar tus credenciales para acceder.</p>
            <div className="flex gap-3">
              <button onClick={() => setIsLogoutOpen(false)} disabled={isLoggingOut} className="flex-1 py-3 rounded-xl font-semibold text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">Cancelar</button>
              <button onClick={confirmLogout} disabled={isLoggingOut} className="flex-1 py-3 rounded-xl font-bold text-white bg-red-600 shadow-[0_4px_14px_rgba(220,38,38,0.35)] hover:shadow-[0_6px_20px_rgba(220,38,38,0.45)] hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none">
                {isLoggingOut ? <><Loader2 size={16} className="animate-spin" /> Saliendo...</> : "Salir"}
              </button>
            </div>
          </div>
        </div>
      )}

      {isSettingsOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-[100] bg-slate-900/40 backdrop-blur-sm p-4" onClick={() => !isSavingSettings && setIsSettingsOpen(false)}>
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-5 bg-gradient-to-r from-[#0B5394] to-[#0E7490] text-white">
              <h3 className="text-lg font-bold">Configuración</h3>
              <button onClick={() => setIsSettingsOpen(false)} disabled={isSavingSettings} className="text-white/80 hover:text-white disabled:opacity-50"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-6">
              <div className="flex items-start justify-between">
                <div className="flex gap-3">
                  <Shield className="text-[#0E7490] shrink-0 mt-1" size={20} />
                  <div><h4 className="text-sm font-bold text-slate-800">Autenticación (2FA)</h4><p className="text-xs text-slate-500 mt-1">Requiere un código de app autenticadora.</p></div>
                </div>
                <div className={`w-10 h-6 bg-gradient-to-r from-[#0B5394] to-[#0E7490] rounded-full relative shadow-inner ${isSavingSettings ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}><div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm"></div></div>
              </div>
              <div className="h-px bg-slate-100"></div>
              <div className="flex items-start justify-between">
                <div className="flex gap-3">
                  <Bell className="text-[#0E7490] shrink-0 mt-1" size={20} />
                  <div><h4 className="text-sm font-bold text-slate-800">Alertas de Interconsulta</h4><p className="text-xs text-slate-500 mt-1">Recibir email cuando se comparta un caso.</p></div>
                </div>
                <div className={`w-10 h-6 bg-gradient-to-r from-[#0B5394] to-[#0E7490] rounded-full relative shadow-inner ${isSavingSettings ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}><div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm"></div></div>
              </div>
            </div>
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button onClick={handleSaveSettings} disabled={isSavingSettings} className="px-6 py-2.5 rounded-xl font-bold text-white bg-gradient-to-r from-[#0B5394] to-[#0E7490] shadow-[0_4px_14px_rgba(11,83,148,0.35)] hover:shadow-[0_6px_20px_rgba(11,83,148,0.45)] hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 disabled:transform-none">
                {isSavingSettings ? <><Loader2 size={16} className="animate-spin" /> Guardando...</> : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {isProfileOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-[100] bg-slate-900/40 backdrop-blur-sm p-4" onClick={() => setIsProfileOpen(false)}>
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-5 bg-gradient-to-r from-[#0B5394] to-[#0E7490] text-white">
              <h3 className="text-lg font-bold">Perfil del Médico</h3>
              <button onClick={() => setIsProfileOpen(false)} className="text-white/80 hover:text-white"><X size={20} /></button>
            </div>
            <div className="p-6">
              <div className="flex flex-col items-center mb-6">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#0B5394] to-[#0E7490] flex items-center justify-center text-white text-2xl font-bold shadow-lg mb-4">
                  {user?.nombre && user?.apellido ? `${user.nombre[0]}${user.apellido[0]}`.toUpperCase() : 'U'}
                </div>
                <h2 className="text-xl font-bold text-slate-900">{user?.nombre && user?.apellido ? `${user.nombre} ${user.apellido}` : 'Usuario'}</h2>
                <p className="text-sm font-medium text-slate-500">{user?.rol === 'ADMIN' ? 'Administrador' : 'Médico'}</p>
                <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-bold">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div> Active
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-400 tracking-wider uppercase mb-1 block">Número de Licencia</label>
                  <p className="text-sm font-semibold text-slate-800">No disponible</p>
                </div>
                <div className="h-px bg-slate-100"></div>
                <div>
                  <label className="text-xs font-bold text-slate-400 tracking-wider uppercase mb-1 block">Email de Contacto</label>
                  <p className="text-sm font-semibold text-slate-800">{user?.email || 'No disponible'}</p>
                </div>
                <div className="h-px bg-slate-100"></div>
                <div>
                  <label className="text-xs font-bold text-slate-400 tracking-wider uppercase mb-1 block">Centro Asignado</label>
                  <p className="text-sm font-semibold text-slate-800">CliniData</p>
                </div>
                <div className="h-px bg-slate-100"></div>
                <div>
                  <label className="text-xs font-bold text-slate-400 tracking-wider uppercase mb-1 block">Permisos de Sistema</label>
                  <p className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                    <Shield size={14} className="text-[#0B5394]" /> {user?.rol === 'ADMIN' ? 'Administrador del Sistema' : 'Personal Médico Autorizado'}
                  </p>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button onClick={() => setIsProfileOpen(false)} className="px-6 py-2.5 rounded-xl font-bold text-slate-600 bg-white border border-slate-200 shadow-sm hover:bg-slate-50 transition-all duration-200">
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
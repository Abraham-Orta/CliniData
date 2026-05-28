import { useState } from 'react';
import { LoginCard } from './LoginCard';
import { PatientHub } from './PatientHub';
import { MedicalHistory } from './components/MedicalHistory';
import { type Patient } from './components/PatientCard';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  // 1. Pantalla de Login
  if (!isAuthenticated) {
    return <LoginCard onLogin={() => setIsAuthenticated(true)} />;
  }

  // 2. Pantalla de Historia Clínica (Si se seleccionó un paciente)
  if (selectedPatient) {
    return <MedicalHistory patient={selectedPatient} onBack={() => setSelectedPatient(null)} />;
  }

  // 3. Pantalla del Directorio (Por defecto si está autenticado)
  return <PatientHub onPatientSelect={setSelectedPatient} onLogout={() => setIsAuthenticated(false)} />;
}
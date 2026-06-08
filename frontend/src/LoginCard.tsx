import React, { useState } from "react";
import { Lock, Eye, EyeOff, ShieldCheck, ChevronRight } from "lucide-react";
import { useAuth } from "./context/AuthContext";

export function LoginCard() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSsoLoading, setIsSsoLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    
    // Simula la validación restrictiva en el servidor
    setTimeout(() => {
      setIsLoading(false);
      
      if (password.length < 6) {
        setError("Credenciales inválidas. Verifica tu contraseña.");
        return;
      }
      
      if (Math.random() < 0.15) {
        setError("Error de conexión con el directorio activo. Inténtalo de nuevo.");
        return;
      }

      // Mock user object
      const user = {
        id: "dr-rachel-kim",
        name: "Dr. Rachel Kim",
        email: email,
        role: "admin",
        specialty: "Medicina Interna"
      };

      // Create a mock token
      const mockToken = "mock_jwt_token_" + Date.now();
      
      login(mockToken, user);
    }, 1500); 
  };

  const handleSsoClick = () => {
    setError(null);
    setIsSsoLoading(true);
    setTimeout(() => {
      setIsSsoLoading(false);
      if (Math.random() < 0.15) {
        setError("Servicio SSO no disponible en este momento.");
        return;
      }
      
      const user = {
        id: "dr-rachel-kim",
        name: "Dr. Rachel Kim",
        email: "rachel.kim@clinidata.app",
        role: "admin",
        specialty: "Medicina Interna"
      };
      
      login("mock_sso_jwt_token_" + Date.now(), user);
    }, 1800);
  };

  return (
    <div
      className="min-h-screen w-full flex flex-col items-center justify-center px-4"
      style={{ backgroundColor: "#F8FAFC", fontFamily: "'Inter', sans-serif" }}
    >
      {/* Subtle background grid */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(11,83,148,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(11,83,148,0.03) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      {/* Header brand strip */}
      <div className="relative z-10 flex items-center gap-3 mb-10">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shadow-md"
          style={{ backgroundColor: "#0B5394" }}
        >
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
            <rect x="9" y="2" width="4" height="18" rx="2" fill="white" />
            <rect x="2" y="9" width="18" height="4" rx="2" fill="white" />
          </svg>
        </div>
        <span
          className="tracking-tight"
          style={{
            fontSize: "22px",
            fontWeight: 700,
            color: "#0B5394",
            letterSpacing: "-0.02em",
          }}
        >
          CliniData
        </span>
        <span
          className="px-2 py-0.5 rounded-full text-white"
          style={{
            fontSize: "10px",
            fontWeight: 600,
            backgroundColor: "#0E7490",
            letterSpacing: "0.06em",
            textTransform: "uppercase",
          }}
        >
          Corporativo
        </span>
      </div>

      {/* Login Card */}
      <div
        className="relative z-10 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden"
        style={{
          backgroundColor: "#ffffff",
          boxShadow:
            "0 20px 60px rgba(11,83,148,0.10), 0 4px 16px rgba(11,83,148,0.06)",
        }}
      >
        {/* Top accent bar */}
        <div
          className="h-1.5 w-full"
          style={{
            background: "linear-gradient(90deg, #0B5394 0%, #0E7490 50%, #0891B2 100%)",
          }}
        />

        <div className="px-10 pt-9 pb-10">
          {/* Security badge */}
          <div className="flex items-center gap-2 mb-8">
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
              style={{ backgroundColor: "#F0F9FF", border: "1px solid #BAE6FD" }}
            >
              <ShieldCheck size={13} color="#0E7490" strokeWidth={2.5} />
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 600,
                  color: "#0E7490",
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                }}
              >
                Cifrado TLS de 256-bits
              </span>
            </div>
          </div>

          {/* Heading */}
          <div className="mb-8">
            <h1
              style={{
                fontSize: "26px",
                fontWeight: 700,
                color: "#0F172A",
                letterSpacing: "-0.025em",
                lineHeight: 1.25,
                marginBottom: "6px",
              }}
            >
              Bienvenido de nuevo
            </h1>
            <p
              style={{
                fontSize: "15px",
                fontWeight: 400,
                color: "#64748B",
                lineHeight: 1.5,
              }}
            >
              Accede a tu panel de inteligencia clínica
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {/* Error Banner */}
            {error && (
              <div className="p-3 rounded-lg text-sm font-semibold text-red-600 bg-red-50 border border-red-100 animate-in fade-in slide-in-from-top-1">
                {error}
              </div>
            )}

            {/* Email field */}
            <div className="flex flex-col gap-2">
              <label
                htmlFor="email"
                style={{
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "#334155",
                  letterSpacing: "0.01em",
                }}
              >
                Correo Institucional
              </label>
              <div
                className="relative flex items-center rounded-xl transition-all duration-200"
                style={{
                  border: focusedField === "email"
                    ? "1.5px solid #0B5394"
                    : "1.5px solid #E2E8F0",
                  backgroundColor: focusedField === "email" ? "#FAFCFF" : "#F8FAFC",
                  boxShadow: focusedField === "email"
                    ? "0 0 0 3px rgba(11,83,148,0.08)"
                    : "none",
                }}
              >
                <svg
                  className="absolute left-4 shrink-0"
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                >
                  <path
                    d="M2 4a1 1 0 011-1h10a1 1 0 011 1v8a1 1 0 01-1 1H3a1 1 0 01-1-1V4z"
                    stroke={focusedField === "email" ? "#0B5394" : "#94A3B8"}
                    strokeWidth="1.5"
                  />
                  <path
                    d="M2 5l6 4 6-4"
                    stroke={focusedField === "email" ? "#0B5394" : "#94A3B8"}
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
                <input
                  id="email"
                  type="email"
                  value={email}
                  disabled={isLoading || isSsoLoading}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setFocusedField("email")}
                  onBlur={() => setFocusedField(null)}
                  placeholder="dr.apellido@clinica.com"
                  required
                  className="w-full bg-transparent outline-none pl-11 pr-4 py-3.5 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    fontSize: "15px",
                    fontWeight: 400,
                    color: "#0F172A",
                  }}
                />
              </div>
            </div>

            {/* Password field */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="password"
                  style={{
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "#334155",
                    letterSpacing: "0.01em",
                  }}
                >
                  Contraseña
                </label>
                <a
                  href="#"
                  style={{
                    fontSize: "12px",
                    fontWeight: 500,
                    color: "#0E7490",
                    textDecoration: "none",
                  }}
                  onMouseEnter={(e) =>
                    ((e.target as HTMLElement).style.color = "#0B5394")
                  }
                  onMouseLeave={(e) =>
                    ((e.target as HTMLElement).style.color = "#0E7490")
                  }
                >
                  ¿Olvidaste tu contraseña?
                </a>
              </div>
              <div
                className="relative flex items-center rounded-xl transition-all duration-200"
                style={{
                  border: focusedField === "password"
                    ? "1.5px solid #0B5394"
                    : "1.5px solid #E2E8F0",
                  backgroundColor:
                    focusedField === "password" ? "#FAFCFF" : "#F8FAFC",
                  boxShadow:
                    focusedField === "password"
                      ? "0 0 0 3px rgba(11,83,148,0.08)"
                      : "none",
                }}
              >
                <Lock
                  size={16}
                  className="absolute left-4 shrink-0"
                  color={focusedField === "password" ? "#0B5394" : "#94A3B8"}
                  strokeWidth={2}
                />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  disabled={isLoading || isSsoLoading}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocusedField("password")}
                  onBlur={() => setFocusedField(null)}
                  placeholder="••••••••••••"
                  required
                  className="w-full bg-transparent outline-none pl-11 pr-12 py-3.5 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    fontSize: "15px",
                    fontWeight: 400,
                    color: "#0F172A",
                    letterSpacing: password && !showPassword ? "0.15em" : "normal",
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 flex items-center justify-center transition-colors duration-150"
                  style={{ background: "none", border: "none", cursor: "pointer" }}
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff size={16} color="#94A3B8" />
                  ) : (
                    <Eye size={16} color="#94A3B8" />
                  )}
                </button>
              </div>
            </div>

            {/* Remember me */}
            <div className="flex items-center gap-2.5">
              <input
                type="checkbox"
                id="remember"
                disabled={isLoading || isSsoLoading}
                className="rounded disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  width: "16px",
                  height: "16px",
                  accentColor: "#0B5394",
                  cursor: "pointer",
                }}
              />
              <label
                htmlFor="remember"
                style={{
                  fontSize: "13px",
                  fontWeight: 400,
                  color: "#64748B",
                  cursor: "pointer",
                }}
              >
                Mantener sesión iniciada por 30 días
              </label>
            </div>

            {/* Sign In button */}
            <button
              type="submit"
              disabled={isLoading}
              className="relative w-full flex items-center justify-center gap-2 rounded-xl py-3.5 mt-1 transition-all duration-200 group overflow-hidden"
              style={{
                background: isLoading
                  ? "#94A3B8"
                  : "linear-gradient(135deg, #0B5394 0%, #0E7490 100%)",
                color: "#ffffff",
                fontSize: "15px",
                fontWeight: 600,
                border: "none",
                cursor: isLoading ? "not-allowed" : "pointer",
                letterSpacing: "0.01em",
                boxShadow: isLoading
                  ? "none"
                  : "0 4px 14px rgba(11,83,148,0.35)",
              }}
              onMouseEnter={(e) => {
                if (!isLoading) {
                  (e.currentTarget as HTMLButtonElement).style.boxShadow =
                    "0 6px 20px rgba(11,83,148,0.45)";
                  (e.currentTarget as HTMLButtonElement).style.transform =
                    "translateY(-1px)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isLoading) {
                  (e.currentTarget as HTMLButtonElement).style.boxShadow =
                    "0 4px 14px rgba(11,83,148,0.35)";
                  (e.currentTarget as HTMLButtonElement).style.transform =
                    "translateY(0)";
                }
              }}
            >
              {isLoading ? (
                <>
                  <svg
                    className="animate-spin"
                    width="18"
                    height="18"
                    viewBox="0 0 18 18"
                    fill="none"
                  >
                    <circle
                      cx="9"
                      cy="9"
                      r="7"
                      stroke="rgba(255,255,255,0.3)"
                      strokeWidth="2"
                    />
                    <path
                      d="M9 2a7 7 0 017 7"
                      stroke="white"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                  Validando credenciales...
                </>
              ) : (
                <>
                  Iniciar Sesión
                  <ChevronRight
                    size={16}
                    className="transition-transform duration-200 group-hover:translate-x-0.5"
                  />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px" style={{ backgroundColor: "#E2E8F0" }} />
            <span style={{ fontSize: "12px", fontWeight: 500, color: "#94A3B8" }}>
              O
            </span>
            <div className="flex-1 h-px" style={{ backgroundColor: "#E2E8F0" }} />
          </div>

          {/* SSO Button */}
          <button
            onClick={handleSsoClick}
            disabled={isLoading || isSsoLoading}
            className="w-full flex items-center justify-center gap-2.5 rounded-xl py-3 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              border: "1.5px solid #E2E8F0",
              backgroundColor: "#ffffff",
              fontSize: "14px",
              fontWeight: 500,
              color: "#334155",
              cursor: (isLoading || isSsoLoading) ? "not-allowed" : "pointer",
            }}
            onMouseEnter={(e) => {
              if (isLoading || isSsoLoading) return;
              (e.currentTarget as HTMLButtonElement).style.borderColor = "#0B5394";
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#F8FAFC";
            }}
            onMouseLeave={(e) => {
              if (isLoading || isSsoLoading) return;
              (e.currentTarget as HTMLButtonElement).style.borderColor = "#E2E8F0";
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#ffffff";
            }}
          >
            {isSsoLoading ? (
              <svg className="animate-spin" width="18" height="18" viewBox="0 0 18 18" fill="none">
                <circle cx="9" cy="9" r="7" stroke="#0B5394" strokeWidth="2" strokeDasharray="10 10"/>
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <rect width="18" height="18" rx="4" fill="#F1F5F9" />
                <path
                  d="M9 4.5L13.5 7.5v3L9 13.5 4.5 10.5v-3L9 4.5z"
                  stroke="#0B5394"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                />
                <circle cx="9" cy="9" r="1.5" fill="#0E7490" />
              </svg>
            )}
            Continuar con SSO / Directorio Activo
          </button>
        </div>

        {/* Footer inside card */}
        <div
          className="px-10 py-4 flex items-center justify-center gap-1"
          style={{
            borderTop: "1px solid #F1F5F9",
            backgroundColor: "#FAFCFF",
          }}
        >
          <Lock size={11} color="#94A3B8" strokeWidth={2} />
          <span style={{ fontSize: "11px", fontWeight: 400, color: "#94A3B8" }}>
            Conexión protegida de extremo a extremo. Cifrado asimétrico activo.
          </span>
        </div>
      </div>

      {/* Bottom footer */}
      <div className="relative z-10 mt-8 flex items-center gap-4">
        {["Política de Privacidad", "Términos de Uso", "Soporte Técnico"].map((item) => (
          <a
            key={item}
            href="#"
            style={{
              fontSize: "12px",
              fontWeight: 400,
              color: "#94A3B8",
              textDecoration: "none",
            }}
            onMouseEnter={(e) =>
              ((e.target as HTMLElement).style.color = "#0E7490")
            }
            onMouseLeave={(e) =>
              ((e.target as HTMLElement).style.color = "#94A3B8")
            }
          >
            {item}
          </a>
        ))}
      </div>
      <p
        className="relative z-10 mt-3"
        style={{ fontSize: "11px", color: "#CBD5E1", fontWeight: 400 }}
      >
        © 2026 CliniData, Inc. Todos los derechos reservados.
      </p>
    </div>
  );
}
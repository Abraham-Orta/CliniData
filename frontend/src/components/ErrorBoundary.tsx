import React, { Component, ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      // @ts-ignore
      if (this.props.fallback) return this.props.fallback;
      
      return (
        <div className="flex h-screen w-full items-center justify-center bg-[#F8FAFC]">
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 max-w-md w-full text-center">
            <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <AlertTriangle size={32} className="text-rose-500" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Algo salió mal</h2>
            <p className="text-sm font-medium text-slate-500 mb-6">
              Ha ocurrido un error inesperado en la aplicación. Nuestro equipo técnico ha sido notificado.
            </p>
            {this.state.error && (
              <div className="bg-slate-50 border border-slate-100 rounded-lg p-4 mb-6 text-left overflow-auto">
                <p className="text-xs text-slate-600 font-mono break-all">{this.state.error.toString()}</p>
              </div>
            )}
            <button 
              onClick={() => window.location.reload()}
              className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-[#0B5394] to-[#0E7490] text-white rounded-xl text-sm font-bold shadow-[0_4px_14px_rgba(11,83,148,0.35)] hover:-translate-y-0.5 transition-all"
            >
              <RefreshCw size={16} /> Recargar Aplicación
            </button>
          </div>
        </div>
      );
    }

    // @ts-ignore
    return this.props.children;
  }
}

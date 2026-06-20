# CliniData - Frontend Dashboard

Panel de gestión clínica desarrollado en React 18. Arquitectura escalable y preparada para integración "plug-and-play" con backend REST.

## Stack Tecnológico
- **Core:** React 18 + Vite (Entorno SPA).
- **Lenguaje:** TypeScript (Tipado estricto para modelos de dominio médico).
- **Estilos:** Tailwind CSS (Diseño utilitario y responsivo).
- **Gráficos:** Recharts (Visualización de datos hospitalarios).
- **Componentes / UI:** Lucide React (Iconos), Sonner (Toasts de notificación).

## Arquitectura de Integración (Para el equipo de Backend)

El proyecto está diseñado con aislamiento entre la capa de presentación y la capa de datos.

### 1. Cliente API (`src/lib/apiClient.ts`)
Gestiona todas las peticiones fetch de forma centralizada.
- Inyecta automáticamente el token de autorización (`Bearer <token>`) desde el `localStorage`.
- Intercepta errores globales (ej. emite evento `auth:unauthorized` ante un 401).
- La URL base se lee de `.env` usando `VITE_API_URL` (por defecto `/api` con proxy a `localhost:3000` en Vite para evitar CORS en desarrollo local).

### 2. Gestión de Estado Asíncrono (`src/hooks/useApi.ts`)
Hook que abstrae la lógica de carga (`isLoading`), data y captura de errores. Se integra con `sonner` para emitir *toast notifications* de error de forma automática si las llamadas al servidor fallan.

### 3. Capa de Servicios (`src/services/`)
Todos los accesos a datos pasan por aquí. Actualmente utilizan datos "mockeados" a través de `simulateNetworkCall` para validar los flujos de la interfaz. 
**Responsabilidad del backend:** Reemplazar las funciones que devuelven `mockDb` por llamadas directas mediante `apiClient.get()` o `apiClient.post()`. Toda la interfaz de tipos a devolver está definida explícitamente en `src/types.ts`.

## Módulos del Sistema
- **Pacientes:** Tabla inteligente con persistencia de filtros (condición, urgencia), paginación conceptual y control de casos compartidos entre especialistas.
- **Agenda:** Vista temporal de citas. Incluye modales de captura de datos, manejo de estados (confirmada, cancelada, completada) e interfaces de reprogramación.
- **Reportes:** Panel analítico de control de camas, índices de readmisión, resolutividad y gráficos sectoriales (tasa de diagnósticos).

## Comandos Disponibles
```bash
# Instalación de dependencias
npm install

# Levantar servidor de desarrollo (Expone en puerto 3000 con proxy a /api)
npm run dev

# Compilar para producción (Genera directorio /dist óptimo)
npm run build

# Validar estáticamente el tipado
npm run lint

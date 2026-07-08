# CliniData

[![Backend](https://img.shields.io/badge/Backend-Node.js%20%2B%20Express-3C873A)]()
[![Frontend](https://img.shields.io/badge/Frontend-React%20%2B%20Vite-61DAFB)]()
[![Database](https://img.shields.io/badge/Database-SQLite-003B57)]()
[![CI/CD](https://img.shields.io/badge/CI%2FCD-GitHub%20Actions-2088FF)]()

Plataforma clínica full-stack para gestión de pacientes, consultas, adjuntos, auditoría y paneles operativos.

## Enlaces rápidos

- [Backend README](./backend/README.md)
- [API OpenAPI](./backend/openapi.yaml)
- [Documentación técnica](./backend/docs/api_documentation.md)
- [Frontend README](./frontend/README.md)
- [Arquitectura y Estadísticas (Venezuela)](./docs/estadisticas_analisis_venezuela.md)

## Estructura

- `backend/`: API REST con Node.js, Express, Prisma y SQLite.
- `frontend/`: SPA en React + Vite + TypeScript.
- `docker-compose.production.yml`: despliegue base con Docker.
- `.github/workflows/`: CI/CD con GitHub Actions.

## Stack

- **Backend:** Node.js, Express, Prisma, SQLite, JWT, bcrypt, multer.
- **Frontend:** React, Vite, TypeScript, Tailwind, Recharts.
- **Infra:** Docker, GitHub Actions, Docker Buildx.

## Funcionalidades

- Autenticación con JWT y control de roles (ADMIN, MEDICO, ENFERMERO).
- Gestión de pacientes e historias clínicas cifradas (AES-256-GCM).
- **Módulo de Triaje**: Sala de espera en tiempo real para médicos y enfermeros.
- Consultas médicas con regla estricta de autoría (solo el creador edita su historia clínica).
- Control de acceso clínico (RBAC/ReBAC relacional).
- Auditoría de acciones sensibles.
- **Centro de Inteligencia Clínica**: Reportes epidemiológicos MPPS (EPI-12 Semanal, EPI-15 Mensual) y métricas de ausentismo.

## Arranque rápido

### Backend

```bash
cd backend
npm install
npm run prisma:push
npm run prisma:generate
# Genera 60+ pacientes, 180+ consultas reales y usuarios (usando Faker)
npm run seed
npm run dev
```

API local:
- `http://localhost:3000`
- Swagger: `http://localhost:3000/docs`

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend local:
- `http://localhost:5173` o el puerto mostrado por Vite

## Desarrollo local completo

1. Levanta el backend en una terminal.
2. Levanta el frontend en otra terminal.
3. Accede al frontend y usa el login para consumir la API real.

## Variables de entorno

### Backend

- `DATABASE_URL=file:./dev.db`
- `JWT_SECRET`
- `ENCRYPTION_KEY`
- `PORT` (opcional, por defecto `3000`)

### Frontend

- `VITE_API_URL=/api` en desarrollo

## Documentación

- `backend/README.md`: guía técnica del backend.
- `backend/openapi.yaml`: especificación OpenAPI.
- `backend/docs/api_documentation.md`: documentación detallada de la API.
- `frontend/README.md`: guía del frontend.

## CI/CD y Docker

- Workflows en `.github/workflows/`.
- Imagen de backend en Docker multi-stage.
- Despliegue sugerido: `docker-compose.production.yml`.
- Publicación de imágenes: GHCR en releases/tags.

## Pruebas

```bash
cd backend
npm test
```

## Notas

- No subir secretos reales al repositorio.
- Si ejecutas frontend y backend en la misma máquina, evita choque de puertos usando un puerto distinto para uno de los dos.

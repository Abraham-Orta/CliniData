Backend CliniData — Quickstart

Resumen rápido para desarrolladores frontend/equipo:

Prerequisitos:
- Node 24 (usar nvm)
- npm

Instalación y arranque:
1. Copiar ejemplo de env y editar valores:
   cp .env.example .env
   Editar .env: establecer JWT_SECRET y ENCRYPTION_KEY seguros.
2. Instalar dependencias:
   cd backend && npm install
3. Generar Prisma y DB:
   npx prisma generate && npx prisma db push
4. Sembrar datos de ejemplo (crea datos masivos con Faker: pacientes, visitas, admin, médicos):
   npm run seed
5. Arrancar servidor en desarrollo:
   npm run dev
6. Documentación OpenAPI/Swagger disponible en:
   http://localhost:3000/docs

Credenciales de ejemplo (seed):
- Médico A: medico.a@example.com / password123
- Médico B: medico.b@example.com / password123
- Admin: admin@example.com / password123

Endpoints clave:
- POST /api/auth/login
- GET /api/users/me
- GET /api/patients?search=term
- GET /api/patients/:id
- POST /api/consultas
- POST /api/consultas/:id/attachments
- GET /api/consultas/:id/attachments
- GET /api/consultas/:id/attachments/:attachmentId
- DELETE /api/consultas/:id/attachments/:attachmentId

Soporte y pruebas:
- Ejecutar tests: npm test
- Si Prisma da error WASM, asegúrate de usar Node 24 y reinstala deps.

Notas de seguridad:
- No subir .env con secretos al repo.
- ENCRYPTION_KEY y JWT_SECRET deben estar en CI y entorno de producción como secrets.

---

## CI/CD y Docker

- El backend se construye con Docker multi-stage (Node 18 slim, non-root user, HEALTHCHECK, imagen pequeña).
- Usa `npm ci`, `npx prisma generate` y `npm run build` en el build.
- Workflows de GitHub Actions:
  - `.github/workflows/ci.yml`: Lint, test y build de imagen (con buildx y cache).
  - `.github/workflows/publish.yml`: Publica imagen a GHCR en releases.
- Variables sensibles (JWT_SECRET, ENCRYPTION_KEY) deben configurarse como secrets en CI y producción.
- Despliegue recomendado: `docker-compose.production.yml`.
- Imagen expone `/health` para chequeo de vida.

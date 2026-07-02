# Documentación técnica completa — Backend CliniData

Este documento describe en detalle el backend (Node/Express + Prisma + SQLite) para que frontend y demás equipos integren y prueben la API de forma segura y sin dudas.

---

## Resumen
- URL base (local): http://localhost:3000
- Swagger (OpenAPI): http://localhost:3000/docs (archivo: backend/openapi.yaml)
- Nuevos endpoints: /api/appointments (CRUD de Citas) disponibles — ver OpenAPI y sección Agenda/Citas más abajo
- Objetivo: API segura con login, RBAC/ReBAC, cifrado a nivel de campo (FLE), auditoría, adjuntos y endpoints clínicos mínimos.

---

## Requisitos previos
- Node.js LTS 24 (usar nvm: `nvm install 24 && nvm use 24`)
- npm >= 9
- SQLite (no se requiere instalación separada, Prisma usa archivo dev.db)

---

## Variables de entorno (mínimas)
Colocar en `backend/.env` o variables CI:
- DATABASE_URL=file:./dev.db
- JWT_SECRET=**(secreto fuerte)**
- ENCRYPTION_KEY=**(clave simétrica para AES-GCM, 32 bytes preferible)**
- SEED_ADMIN_EMAIL (opcional) — default admin@example.com
- SEED_ADMIN_PASSWORD (opcional) — default password123
- PORT (opcional) — default 3000
- ALLOWED_ORIGINS (opcional) — coma-separado para CORS

Seguridad: guardar JWT_SECRET y ENCRYPTION_KEY como secretos seguros y no subirlos al repo.

---

## Arranque local (quickstart)
1. Activar Node 24: `nvm install 24 && nvm use 24`
2. Instalar dependencias: `cd backend && npm install`
3. Generar Prisma y BD: `npx prisma generate && npx prisma db push`
4. Sembrar datos de ejemplo: `npm run seed`
5. Levantar servidor: `npm run dev` o `node index.js`
6. Abrir docs: `http://localhost:3000/docs`

---

## Contratos de Autenticación
### Login
- POST /api/auth/login
- Body: { "email": "...", "password": "..." }
- Respuesta 200: { "token": "<JWT>" }
- Errores: 401 credenciales inválidas

JWT payload (claims): { userId, role, clinicaId, iat, exp }
Enviar en header: `Authorization: Bearer <token>`

### Registro (solo para scripts/ADMINS)
- POST /api/auth/register
- Body: { email, password, nombre, apellido, rol? }
- Respuesta 201: user object (sin password)

---

## Flujo de Roles y Seguridad
- Roles: ADMIN, MEDICO.
- RBAC: middleware `authorize(['ROLE'])` protege rutas por rol.
- ReBAC (relacional): `validatePatientAccess` verifica si el médico está autorizado para un paciente (medicoPrincipal, colaborador en consultas, o historial de consultas).
- ADMIN: separado — por política no puede ver datos clínicos (se aplica restricción explícita en authorize salvo para operaciones administrativas como DELETE).

---

## Cifrado a nivel de campo (FLE)
- Algoritmo: AES-256-GCM
- Clave: ENCRYPTION_KEY (derivada internamente con scrypt según securityHelper)
- Formato almacenado: `iv:tag:cipherHex` (concatenado con `:`)
- Índices ciegos (blind index): HMAC-SHA256 sobre valor derivado para búsquedas seguras (`documentoIdentidadHash`, etc.)
- Funciones útiles: `src/utils/securityHelper.js` → `encrypt`, `decrypt`, `generateBlindIndex`

Importante: cambiar ENCRYPTION_KEY requiere re-seed o migración de datos legibles.

---

## Modelos principales (resumen)
- Clinica: id, nombre, direccion, telefono
- Usuario: id, email, nombre, apellido, password(hashed), rol, activo, clinicaId, creadoEn
- Paciente: id, nombre (cifrado), apellido (cifrado), fechaNacimiento, genero, documentoIdentidad (cifrado), documentoIdentidadHash, telefono, email, medicoPrincipalId, clinicaId, creadoEn
- Consulta: id, motivo (cifrado), sintomas (cifrado), observaciones (cifrado), pacienteId, medicoId, diagnosticos (rel), tratamientos (rel), notasClinicas (rel), colaboradores (rel), adjuntos (rel), creadoEn
- Adjunto: id, nombre (cifrado), ruta, mimeType, size, consultaId, creadoEn
- Diagnostico, Tratamiento, NotaClinica, Auditoria (accion, detalles, usuarioId, ipAddress, creadoEn)

(Ver `prisma/schema.prisma` para todos los campos y relaciones exactas.)

---

## Endpoints detallados (ejemplos y respuestas)
Se recomienda usar Swagger UI (`/docs`) para ver ejemplos automáticos. Abajo ejemplos concretos clave.

1) Health
- GET /health
- Respuesta 200: `{ "status": "OK" }`

2) Login (obtener token)
- POST /api/auth/login
- Ejemplo curl:
  curl -X POST http://localhost:3000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"medico.a@example.com","password":"password123"}'
- Respuesta corta:
  { "token": "eyJ..." }

3) Obtener usuario actual
- GET /api/users/me
- Auth: Bearer token (cualquier rol autenticado)
- Respuesta 200: datos del usuario (id,email,nombre,apellido,rol,clinicaId)

4) Listar pacientes (MÉDICO)
- GET /api/patients
- Auth: Bearer (rol MEDICO)
- Query params: page, limit (paginación)
- Respuesta 200: { data: [ { paciente }, ... ], meta: { total, page, limit, totalPages } }

5) Obtener paciente por id (MEDICO + ReBAC)
- GET /api/patients/:id
- Auth: Bearer (MEDICO)
- ReBAC: `validatePatientAccess` comprobará relación; 403 si no autorizado
- Respuesta 200: objeto paciente con campos descifrados por backend

6) Crear consulta (MEDICO)
- POST /api/consultas
- Body mínimo: { pacienteId, motivo, sintomas?, presionArterial?, temperatura?, frecuenciaCardiaca?, peso?, observaciones?, diagnosticos?, tratamientos?, colaboradores? }
- El middleware verifica acceso al pacienteId
- Respuesta 201: consulta creada con relaciones incluidas

7) Agregar colaborador a consulta (MEDICO)
- POST /api/consultas/:id/colaboradores
- Body: { medicoId }
- Respuesta 200: estado/registro actualizado

8) Notas clínicas (MEDICO)
- POST /api/consultas/:id/notas
- Body: { contenido }
- Campo de nota cifrado en DB; res 201 con nota mínima

9) Adjuntos de consulta (MEDICO)
- POST /api/consultas/:id/attachments
  - Body: multipart/form-data con campo `file`
  - Tipos permitidos: application/pdf, image/jpeg, image/png, image/gif
  - Tamaño máximo: 5MB
- GET /api/consultas/:id/attachments
  - Lista metadatos de adjuntos
- GET /api/consultas/:id/attachments/:attachmentId
  - Descarga el archivo con su nombre original
- DELETE /api/consultas/:id/attachments/:attachmentId
  - Elimina el adjunto físico y el registro en BD

10) Dashboard y Auditoría
- GET /api/dashboard (ADMIN o MEDICO) — estadísticas agregadas
- GET /api/auditorias (ADMIN) — listado de eventos de auditoría

---

## Códigos de error comunes
- 400 Bad Request — validación de body/params
- 401 Unauthorized — token inválido/ausente
- 403 Forbidden — RBAC/ReBAC denegado
- 404 Not Found — recurso no existe
- 429 Too Many Requests — rate limiter
- 500 Internal Server Error — fallo no esperado (ver logs)

Mensajes: el middleware devuelve JSON tipo `{ error: '...' }`.

---

## Logs y auditoría
- Se registra auditoría en acciones sensibles (login fallido/éxitos, cambios de estado de usuarios, accesos a expedientes cuando aplica).
- Tabla `auditoria` guarda: accion, detalles, usuarioId, ipAddress, creadoEn.

---

## Tests
- Ejecutar: `cd backend && npm test`
- Suites incluidas: security.test.js, auth.test.js, isolation.test.js, others.
- Estado actual: todas las suites pasan localmente (ver pipeline). Si algún test falla, revisar mensajes y autorizar ajuste de mensajes o middleware.

---

## CI (GitHub Actions)
- Archivos: .github/workflows/ci.yml y .github/workflows/publish.yml
- Pipeline estándar: usa Node 24, instala deps, `npx prisma generate`, `npx prisma db push`, `npm run seed` (opcional en CI con flag), `npm test`.
- Requisitos CI: añadir secrets `JWT_SECRET` y `ENCRYPTION_KEY` en repo settings.

---

## Integración Frontend — guías y recomendaciones
1. Autenticación
   - Login devuelve JWT; almacenarlo en memoria o httpOnly cookie (preferible). Evitar localStorage para producción.
   - Añadir token en header Authorization: `Bearer <token>` en todas las llamadas a endpoints protegidos.
2. Manejo de errores
   - Mostrar errores 401 (redirigir a login), 403 (mostrar mensaje de permiso denegado), 429 (retry con backoff).
3. Datos personales y UI
   - El backend devuelve campos descifrados — frontend no necesita manejar claves.
   - Para búsquedas por documento, enviar el valor tal cual a endpoint search; el backend usa blind index.
4. Flujos recomendados
    - Login → GET /api/users/me → GET /api/patients (lista) → GET /api/patients/:id → POST /api/consultas (crear) → POST /api/consultas/:id/notas → POST/GET/DELETE /api/consultas/:id/attachments

---

## Good-to-know / Troubleshooting
- Error Prisma WASM (prisma_schema_build_bg.wasm): usar Node LTS 24 + reinstalar deps. Solución probada en este repo.
- Datos descifrables: si cambias ENCRYPTION_KEY necesitarás re-seed o migración.
- Si Swagger no aparece en /docs, verificar que `backend/openapi.yaml` exista y servidor reiniciado.

---

## Archivos importantes (ubicaciones)
- backend/index.js — arranque, seguridad global, montaje de rutas y Swagger
- backend/openapi.yaml — especificación OpenAPI para Swagger UI
- backend/docs/api_documentation.md — este archivo (documentación completa)
- backend/src/controllers/* — implementaciones de endpoints
- backend/src/routes/* — rutas y permisos
- backend/src/middleware/* — auth, authorize, accessMiddleware, errorHandler
- backend/src/utils/securityHelper.js — cifrado y blind index
- prisma/schema.prisma — modelos de datos
- prisma/seed.js — datos de ejemplo (credenciales de prueba: medico.a@example.com / password123)

---

## Próximos pasos sugeridos
1. Validar con frontend los ejemplos de login y CRUD pacientes en staging.
2. Decidir storage de token (cookie httpOnly vs localStorage) para el frontend.
3. Poner secretos firmes en CI y entorno de despliegue.
4. Generar colección Postman o Insomnia si el equipo lo prefiere.

---

Si quieres, genero automáticamente:
- colección Postman (JSON)
- README / quickstart en la raíz del repo
- endpoints de ejemplo como archivos curl o scripts de prueba

Indica qué prefieres y lo creo.

Plan de implementación — Backend CliniData (completo)

Resumen
-------
Objetivo: completar las tareas pendientes del backend para dejar un MVP seguro, desplegable y listo para la integración con frontend en 1 semana.
Alcance: seguridad (secrets & KMS), endpoints faltantes (búsquedas, filtros, partial-update), validación, archivos/adjuntos, tests E2E, CI/CD (Docker + publicar docs), observabilidad y hardening.

Supuestos
---------
- Equipo dispone de secrets para JWT_SECRET y ENCRYPTION_KEY (si no, se proveerá valor temporal para pruebas).
- Frontend necesita endpoints de login, listar/buscar/obtener/crear/actualizar pacientes y crear consultas, además de auditoría y dashboard básicos.
- Tiempo objetivo: foco en funcionalidades críticas para demo.

Fases y entregables
-------------------
1) Preparación y seguridad (2 días)
   - Establecer .env.example y documentar variables (hecho). Copiar a .env y configurar secrets en CI.
   - Añadir checks en startup para JWT_SECRET/ENCRYPTION_KEY (ya presente: avisos en dev, bloqueo en prod).
   - Test de re-seed y guía para rotación de ENCRYPTION_KEY.
   Entregable: secrets en CI + checklist en README.

2) Endpoints y validación (2 días)
   - Endpoint de búsqueda avanzada de pacientes (por documento seguro, nombre, apellido, paginado) (GET /api/patients?search=).
   - Endpoints faltantes: search por parámetros (fechaNacimiento, genero), update parcial (PATCH or PUT partial), búsqueda por clínicId/medico.
   - Añadir validadores Zod centralizados y middleware de validación reutilizable.
   Entregable: endpoints y tests unitarios de validación.

3) Files & Attachments (1 día)
   - Soporte opcional para subir adjuntos (ex: imágenes de estudios) con limitaciones y escaneo simple, usando almacenamiento local (uploads/) o S3 (opcional).
   Entregable: endpoint para upload y link en consulta/nota.

4) Tests e2e, ReBAC flows (2 días)
   - Tests de integración que cubran: login → crear paciente → crear consulta → agregar colaborador → acceso por colaborador → acceso negado por otro médico.
   - Harden tests de seguridad: aseguran cifrado y blind index.
   Entregable: suite e2e (Jest + supertest) integrable en CI.

5) CI/CD & Docs (1 día)
   - Asegurar workflow .github/workflows/backend-ci.yml: instalar deps, prisma generate, db push, seed optional, run tests, build docker image.
   - Publicar docs (Swagger) en artefacto o desplegar al /docs en entorno staging.
   Entregable: pipeline que pasa en CI y produce imagen Docker.

6) Observabilidad y hardening (1 día)
   - Añadir logs estructurados (pino/winston), metrics básicas (prom-client) y health/liveness endpoints.
   - Refinar headers (CSP/HSTS) y revisar rate limits.
   Entregable: endpoints /metrics, /health extended, logs JSON en dev/CI.

Tareas (todos) — alto nivel
--------------------------
- set-secrets: Configurar JWT_SECRET y ENCRYPTION_KEY en CI y .env; documentar rotación.
- validation-middleware: Crear middleware reutilizable para Zod (validación request body/params/queries).
- patient-search: Mejorar GET /api/patients para soportar filtros (fechaNacimiento, genero), search por nombre/apellido y search por documento con blind index (ya parcialmente implementado — revisar y cubrir edge cases).
- patient-patch: Implementar PATCH /api/patients/:id (actualización parcial segura) y documentarlo.
- attachments: Soporte upload para adjuntos de consultas (storage local y referencia en DB), validar tipos y tamaños.
- e2e-tests: Crear suite E2E cubriendo ReBAC flows y principales happy-paths.
- ci-docker: Añadir job para build Docker image y publicar (o guardar artefacto) en CI.
- docs-publish: Asegurar openapi.yaml se publique o esté accesible en CI artifacts.
- logs-metrics: Integrar pino/prom-client y exponer /metrics; ajustar formato de logs.
- security-audit: Revisar headers (CSP, HSTS), asegurar rate-limits y payload limits.
- postman-collection (opcional): Generar colección para frontend.

Prioridad y dependencias
------------------------
- Crítico (demo-ready): set-secrets, patient-search, patient-patch, validation-middleware, e2e-tests, docs-publish.
- Media: attachments, ci-docker, logs-metrics.
- Baja: postman-collection, extended hardening.

Responsables sugeridos
----------------------
- Backend lead: coordinar secrets, CI y tests e2e.
- Devs: endpoints y validación.
- Frontend: validar contracts con Swagger; probar flows.

Verificación y criterios de aceptación
-------------------------------------
- CI pasa: tests unitarios + e2e en pipeline.
- Demo flow: login → listar paciente → abrir paciente → crear consulta → agregar colaborador → acceder como colaborador (ok); otro medico no colaborador (403).
- Docs: /docs accesible y correspondencia con endpoints reales.
- Secrets: JWT_SECRET y ENCRYPTION_KEY no en repo; CI usa secretos.

Riesgos
-------
- Rotación de ENCRYPTION_KEY puede volver ilegibles datos si no se planifica.
- Dependencia en Prisma WASM — requiere Node 24 (documentado).
- Carga de archivos sin escaneo puede permitir archivos maliciosos (implementar size/type checks).

Estimación de tiempo
--------------------
Total estimado (prioridad alta) ~ 5 días laborables para dejar demo-ready.

Notas finales
------------
Si quieres que empiece a implementar tareas en paralelo, aprueba y especifica prioridad: "Empezar por secrets y patient-search" o "Empezar por tests e2e".

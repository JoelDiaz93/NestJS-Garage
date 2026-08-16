# Changelog

## 2.0.0

- Reemplaza sincronización automática como camino principal por migraciones TypeORM.
- Añade validación de variables de entorno y restricciones específicas para producción.
- Añade refresh tokens opacos, rotación y revocación.
- Añade historial transaccional de inventario y alertas de stock bajo.
- Evita cambios directos de stock por el DTO de edición de catálogo.
- Añade descuentos, vigencia y snapshots completos a cotizaciones.
- Añade reglas explícitas para transiciones de cotizaciones y órdenes.
- Añade asignación de técnicos y restricciones específicas para ese rol.
- Persiste metadata de evidencias en PostgreSQL.
- Elimina el endpoint HTTP de seed y mueve el seed a CLI/env.
- Restringe CORS HTTP y WebSocket a orígenes configurados.
- Valida usuarios activos en conexiones Socket.IO.
- Añade health endpoint, Dockerfile, Docker Compose, CI, tests de reglas de negocio y documentación de arquitectura/seguridad.
- Integra consumo idempotente de materiales desde la orden de trabajo hacia inventario.
- Añade panel administrativo React/Vite para operar el flujo end-to-end.
- Completa administración de usuarios: roles, activación/desactivación, reset de contraseña y protecciones de auto-bloqueo.

## 2.1.0 - Free hosting deployment

- Added `DATABASE_URL` support for managed PostgreSQL providers such as Neon.
- Added small configurable PostgreSQL connection pool for free-tier environments.
- Added Cloudinary-backed evidence storage without adding an SDK dependency.
- Preserved local evidence storage for development.
- Bound NestJS explicitly to `0.0.0.0` for PaaS deployments.
- Added production migration and Render startup scripts.
- Added explicit portfolio demo mode for idempotent seed execution.
- Added Render Blueprint for API + static admin panel.
- Added free-hosting deployment documentation and Render environment examples.
- Added frontend notice for free-tier API cold starts.

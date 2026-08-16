# Security Policy / Project Hardening

Este repositorio es un proyecto de portafolio, pero evita incluir secretos reales.

## Reglas

- No subir `.env`.
- Usar un `JWT_SECRET` aleatorio de al menos 32 caracteres.
- Mantener `DB_SYNC=false` fuera de experimentos locales.
- Mantener `SEED_ENABLED=false` en producción.
- Restringir `CORS_ORIGIN` a orígenes conocidos.
- Cambiar las credenciales de seed antes de usar el proyecto.
- No servir uploads sensibles públicamente sin autenticación/autorización.
- Usar HTTPS/TLS en cualquier despliegue externo.

## Pendientes productivos

- Rate limiting distribuido en login/refresh.
- Secret manager.
- S3-compatible object storage con URLs firmadas.
- Antivirus/validación profunda de archivos.
- Logs estructurados y trazabilidad de request IDs.
- Backups y pruebas de restauración.
- SAST/Dependency scanning en CI.

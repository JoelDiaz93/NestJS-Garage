# GarageFlow V2 — Project Review

## Resultado

La versión V2 transforma el prototipo inicial en un **modular monolith full-stack** apto para demostración de portafolio.

### Implementado

- Configuración validada por ambiente.
- Migraciones TypeORM y `DB_SYNC=false` por defecto.
- JWT de corta duración + refresh tokens opacos con hash, rotación transaccional y revocación.
- Administración de usuarios, roles, estado y reset de contraseña.
- Revocación de sesiones cuando cambia la contraseña o se desactiva un usuario.
- Clientes y vehículos con normalización y conflictos de unicidad manejados.
- Catálogo de productos/servicios.
- Inventario con historial de movimientos y bloqueo pesimista.
- Alertas de stock bajo.
- Cotizaciones con snapshots, descuento, impuesto, vigencia y reglas de estado.
- Órdenes de trabajo idempotentes desde cotizaciones aprobadas.
- Asignación de técnicos y permisos específicos del rol.
- Consumo idempotente/transaccional de materiales desde una orden.
- Evidencias de trabajo con metadata persistida.
- Socket.IO autenticado y restringido por CORS.
- Health check.
- Seed sólo por CLI y sin credenciales hardcodeadas en código.
- Panel administrativo React/Vite.
- Cliente Socket.IO mínimo independiente.
- Dockerfile, Docker Compose, GitHub Actions y Dependabot.
- Pruebas de reglas monetarias, estados y configuración.
- Documentos README, arquitectura, seguridad, changelog y ejemplos HTTP.

## Validación ejecutada en esta entrega

- 91 archivos TypeScript/TSX revisados mediante análisis sintáctico: **0 errores de parseo**.
- Archivos JSON de backend/frontends validados.
- Smoke test de cálculo de cotización ejecutado correctamente.
- Archivos YAML de Docker Compose y GitHub Actions/Dependabot validados.
- Smoke tests de reglas de negocio y configuración ejecutados correctamente.
- Integridad del ZIP validada al generar la entrega.

## Limitación del entorno de revisión

No fue posible completar `npm install` porque el acceso al registry de npm agotó el tiempo de conexión. Por esa razón, en esta sesión no se pudo ejecutar el `nest build`, Jest real ni los builds Vite con dependencias instaladas.

Al abrir el proyecto en una máquina con acceso normal a npm, el primer control recomendado es:

```bash
npm install
npm run test
npm run build

cd admin-web
npm install
npm run build

cd ../live-dashboard
npm install
npm run build
```

Esto también generará los `package-lock.json`, que conviene versionar para builds reproducibles.

## Próximas mejoras — no bloqueantes para V2

1. Rate limiting distribuido para login/refresh.
2. Object storage S3-compatible y URLs firmadas para evidencias.
3. PDF de cotización y orden de trabajo.
4. Agenda de citas/turnos.
5. Auditoría transversal de cambios.
6. Logging estructurado, métricas y tracing.
7. E2E contra PostgreSQL efímero en CI.
8. Recuperación de contraseña por correo.
9. Refresh token mediante cookie `HttpOnly` para despliegues web públicos.
10. Reportes financieros/operativos y dashboard con series temporales.

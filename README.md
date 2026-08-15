# GarageFlow Platform

Proyecto principal de portafolio basado en los conceptos aprendidos en el curso de NestJS, pero rediseñado como una aplicación real de **gestión de taller automotriz**.

## Alcance funcional

- Usuarios administrados por un `admin` y autenticación JWT.
- Roles: `admin`, `advisor`, `technician`.
- Clientes.
- Vehículos asociados a clientes.
- Catálogo unificado de productos y servicios.
- Inventario y ajustes de stock.
- Cotizaciones con cálculo de subtotal, impuesto y total.
- Conversión de una cotización aprobada a orden de trabajo.
- Estados de orden de trabajo.
- Evidencias fotográficas de órdenes de trabajo (JPG/PNG/WEBP, límite de 5 MB).
- WebSockets para actualizaciones en tiempo real.
- Swagger/OpenAPI.
- PostgreSQL + TypeORM.
- Dashboard Vite mínimo para demostrar Socket.IO.

## Inicio rápido

```bash
cp .env.example .env
docker compose up -d
npm install
npm run start:dev
```

Swagger: `http://localhost:3000/docs`

Para datos de demostración:

```http
POST /api/v1/seed
```

El seed crea un administrador de demostración. **Cambie la contraseña inmediatamente y no utilice esas credenciales en producción.**

## Flujo de demostración recomendado

1. Ejecutar seed.
2. Iniciar sesión en `POST /auth/login` (el seed sólo está habilitado si `SEED_ENABLED=true`).
3. Crear un cliente.
4. Registrar su vehículo.
5. Crear productos/servicios o usar los del seed.
6. Crear una cotización.
7. Cambiar la cotización a `approved`.
8. Crear la orden desde `POST /work-orders/from-quote/:quoteId`.
9. Actualizar el estado de la orden y observar el evento WebSocket en `live-dashboard`.

## Diferencias deliberadas frente al proyecto del curso

- Dominio Tesla/e-commerce reemplazado por operación de taller.
- Productos ahora conviven con servicios.
- Se agregan clientes, vehículos, cotizaciones y órdenes de trabajo.
- Autorización separada de autenticación; los roles no se autoasignan desde un registro público.
- Configuración por ambiente, sin secretos reales incluidos.
- `DB_SYNC` es configurable y debe estar desactivado en producción.
- El WebSocket transmite eventos de negocio, no un chat de demostración.

## Próxima fase

- Historial de movimientos de inventario.
- Persistir metadata de evidencias en PostgreSQL y migrar archivos a S3/objeto storage.
- PDF de cotización y orden de trabajo.
- Auditoría (`createdBy`, `updatedBy`, bitácora de cambios).
- Refresh tokens y recuperación de contraseña.
- Pruebas unitarias/e2e.
- Migraciones TypeORM.
- CI con GitHub Actions.
- Despliegue con Docker y base de datos administrada.

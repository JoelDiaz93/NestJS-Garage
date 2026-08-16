# GarageFlow Platform

GarageFlow es una plataforma full-stack de gestión para talleres automotrices, con backend NestJS/PostgreSQL y panel administrativo React/Vite. Nació a partir de conceptos practicados en un curso de NestJS, pero el dominio, las reglas de negocio y la arquitectura fueron rediseñados para convertirlo en un proyecto de portafolio propio.

## Qué resuelve

GarageFlow concentra el flujo operativo de un taller:

**Cliente → Vehículo → Cotización → Aprobación → Orden de trabajo → Evidencias → Entrega**

También administra productos/servicios e inventario con trazabilidad de movimientos.

## Stack

- NestJS 11 + TypeScript
- PostgreSQL + TypeORM
- JWT + refresh tokens opacos rotativos
- Passport
- Socket.IO
- Swagger/OpenAPI
- Multer para evidencias
- Jest
- Docker / Docker Compose
- GitHub Actions
- React 19 + Vite para el panel administrativo

## Funcionalidades

- Usuarios administrados por roles: `admin`, `advisor`, `technician`, con activación/desactivación y reset de contraseña.
- Login JWT y refresh token rotativo almacenado como hash.
- Clientes y vehículos.
- Catálogo de productos y servicios.
- Ajustes de stock transaccionales con bloqueo pesimista y bitácora de movimientos.
- Alerta de productos con `stock <= minStock`.
- Cotizaciones con snapshots de ítems, descuentos, impuesto, vigencia y transiciones de estado controladas.
- Conversión idempotente de una cotización aprobada a orden de trabajo.
- Asignación de técnicos y flujo de estados de reparación.
- Timestamps operativos: asignación, inicio, finalización y entrega.
- Evidencias JPG/PNG/WEBP con metadata persistida en PostgreSQL.
- Eventos WebSocket `work-order.updated` autenticados con JWT.
- Health check de API/base de datos.
- Migraciones TypeORM; `synchronize` desactivado por defecto.
- Seed por CLI, sin endpoint HTTP ni contraseña hardcodeada.
- Panel administrativo para operar usuarios, clientes, vehículos, catálogo, cotizaciones, órdenes, evidencias y consumo de materiales.
- CI para tests/build del backend y build de ambos frontends.

## Inicio local

### Backend

```bash
cp .env.example .env
docker compose up -d postgres
npm install
npm run migration:run
npm run seed
npm run start:dev
```

API: `http://localhost:3000/api/v1`

Swagger: `http://localhost:3000/docs`

Health: `http://localhost:3000/api/v1/health`

### Panel administrativo

```bash
cd admin-web
cp .env.example .env
npm install
npm run dev
```

Panel: `http://localhost:5174`

### Login del seed

Las credenciales **no están en el código**. Se toman de:

```env
SEED_ADMIN_EMAIL=admin@garageflow.local
SEED_ADMIN_PASSWORD=choose_a_strong_local_password
```

Cambie esos valores en su `.env` local antes de ejecutar `npm run seed`.

## Migraciones

El proyecto evita `synchronize: true` como mecanismo de producción.

```bash
npm run migration:run
npm run migration:revert
npm run migration:generate -- src/database/migrations/NombreMigracion
```

Para Docker Compose completo, el contenedor API usa `DB_MIGRATIONS_RUN=true` y aplica las migraciones al iniciar.

## Flujo de demostración

1. `npm run migration:run`.
2. `npm run seed`.
3. `POST /api/v1/auth/login`.
4. Crear cliente y vehículo.
5. Crear productos/servicios.
6. Ajustar inventario indicando motivo.
7. Crear cotización con descuento/vigencia opcionales.
8. Enviar/aprobar cotización.
9. `POST /api/v1/work-orders/from-quote/:quoteId`.
10. Asignar técnico y avanzar estados.
11. Consumir materiales de la orden para descontar stock de forma transaccional.
12. Adjuntar evidencias.
13. Consultar `GET /api/v1/catalog/alerts/low-stock`.
14. Observar `work-order.updated` desde el panel o `live-dashboard`.

## Seguridad aplicada

- Passwords bcrypt y nunca serializados en login.
- Refresh tokens aleatorios almacenados únicamente como SHA-256.
- Rotación del refresh token en cada renovación.
- Roles controlados del lado servidor.
- CORS configurable por lista de orígenes.
- Configuración de producción rechaza `DB_SYNC=true`, seed habilitado y CORS wildcard.
- Validación global con `whitelist` + `forbidNonWhitelisted`.
- Headers defensivos básicos.
- Upload en memoria: el archivo se escribe sólo después de validar la orden y tipo MIME.
- Secretos sólo por variables de entorno.

> Para un despliegue distribuido de alto tráfico, el siguiente endurecimiento recomendado es rate limiting compartido (por ejemplo Redis), object storage para evidencias, secret manager, observabilidad y rotación de secretos.

## Estructura

```text
src/
├── auth/           # login, refresh/logout, JWT y roles
├── catalog/        # productos, servicios y movimientos de inventario
├── clients/
├── vehicles/
├── quotes/         # cotizaciones y reglas de transición
├── work-orders/    # órdenes, técnicos y estados
├── media/          # evidencias persistidas
├── realtime/       # Socket.IO
├── health/
├── database/       # DataSource + migraciones
├── config/         # validación de variables de entorno
└── seed/           # seed ejecutable por CLI
```

```text
admin-web/          # React/Vite: panel administrativo completo
live-dashboard/     # cliente mínimo para demo aislada de Socket.IO
```

## API de autenticación

```text
POST /api/v1/auth/login
POST /api/v1/auth/refresh
POST /api/v1/auth/logout
GET  /api/v1/auth/me
```

El access token debe enviarse como:

```text
Authorization: Bearer <accessToken>
```

## Estado del proyecto

GarageFlow V2 ya incluye backend y panel administrativo. La siguiente evolución natural sería PDF de cotizaciones/órdenes, agenda de citas, auditoría general, object storage S3-compatible, rate limiting distribuido y observabilidad.

---

## Publicación gratuita para portfolio

La versión 2.1 incluye soporte específico para un stack gratuito de demostración:

- Render Free Web Service para NestJS + Socket.IO.
- Render Static Site para el panel React/Vite.
- Neon PostgreSQL mediante `DATABASE_URL`.
- Cloudinary para evidencias persistentes.
- `render.yaml` como infraestructura declarativa.
- Migraciones automáticas al inicio del servicio Free.

Consulta **[DEPLOY_FREE.md](./DEPLOY_FREE.md)** antes de publicar el repositorio.

## Admin Web 2.2

The admin interface was rebuilt in v2.2.0. It runs separately on port `5174` during local development.

```bash
cd admin-web
cp .env.example .env
npm install
npm run typecheck
npm run build
npm run dev
```

Backend CORS must include `http://localhost:5174` (already present in `.env.example`). See `ADMIN_WEB_REVIEW.md` for the review and fixes.

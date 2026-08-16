# GarageFlow Admin Web

Panel React/Vite para GarageFlow API.

## Requisitos
- Node.js 20+ (recomendado 22 LTS)
- GarageFlow API disponible

## Desarrollo
```bash
cp .env.example .env
npm install
npm run dev
```

Abre `http://localhost:5174`.

## Build
```bash
npm run typecheck
npm run build
npm run preview
```

## Contrato esperado
- API: `VITE_API_URL`, por defecto `http://localhost:3000/api/v1`
- Socket.IO namespace: `VITE_WS_URL`, por defecto `http://localhost:3000/workshop`

El panel implementa refresh token con una única rotación concurrente, navegación por rol, estados válidos de cotización/orden y carga de técnicos mediante `/users/assignable-technicians`.

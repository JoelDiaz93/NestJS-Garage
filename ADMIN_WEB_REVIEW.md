# GarageFlow Admin Web — Functional Review

## Problems found in the previous admin-web

1. The UI attempted to load assignable technicians from `GET /users`, but that endpoint is restricted to administrators. Advisors therefore could not assign technicians.
2. Work orders exposed every possible status in the select, while the backend enforces a transition state machine. Invalid selections returned HTTP 400 and looked like a broken UI.
3. The client was highly compressed and mixed session, WebSocket, navigation and domain rendering, making failures difficult to isolate.
4. Refresh-token rotation had no concurrency guard. Multiple simultaneous HTTP 401 responses could try to rotate the same refresh token more than once.
5. Evidence download did not share the normal authenticated request/refresh flow.
6. There was no application-level error boundary or API health indicator.
7. Inventory movement history existed in the API but was not surfaced in the admin interface.

## Corrections in 2.2.0

- Rebuilt `admin-web` as a structured React/Vite application.
- Conservative dependency baseline: React 18 + Vite 5.
- Added `api/client.ts`, session storage module, configuration module and typed domain models.
- Added a single shared refresh promise to serialize refresh-token rotation.
- Added `GET /users/assignable-technicians` for `admin` and `advisor` roles only.
- Mirrored backend quote/work-order status transitions in the UI.
- Technician-only users see only their assigned work orders in the panel.
- Added inventory movement history.
- Added evidence listing and authenticated evidence opening.
- Added API health status and Render Free wake-up messaging.
- Added application error boundary and responsive layout.
- Added `npm run typecheck` and documented local build commands.

## Validation completed here

- TypeScript/TSX syntax parse for backend + admin web: PASS (92 files).
- Relative import validation for admin web: PASS.
- JSON validation: PASS.
- `render.yaml` parse: PASS when PyYAML is available.
- Frontend/backend route/status smoke checks: PASS.

## Environment limitation

The execution environment could not complete `npm install` from the public npm registry before timing out. Therefore the final Vite bundle could not be produced here. Run the following on a machine with npm connectivity:

```bash
cd admin-web
npm install
npm run typecheck
npm run build
npm run dev
```

The project intentionally does not include `node_modules`.

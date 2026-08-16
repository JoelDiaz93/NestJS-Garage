# GarageFlow — despliegue gratuito (portfolio)

Esta variante está preparada para publicar GarageFlow con servicios gratuitos sin depender del disco local del backend.

## Arquitectura recomendada

```text
Usuario
  |
  v
Render Static Site
React + Vite
  |
  | HTTPS + Socket.IO
  v
Render Free Web Service
NestJS API
  |                  \
  | TLS               \ HTTPS
  v                     v
Neon PostgreSQL       Cloudinary
Free                  Free
```

### Por qué esta arquitectura

- **Render Static Site:** sirve el panel React gratuitamente desde CDN.
- **Render Free Web Service:** ejecuta NestJS y soporta WebSockets/Socket.IO.
- **Neon Free:** PostgreSQL persistente sin el vencimiento de 30 días del PostgreSQL Free de Render.
- **Cloudinary Free:** conserva las evidencias fotográficas aunque Render reinicie o duerma el backend.

> Esta topología es para portfolio, pruebas y demostraciones. El plan Free de Render puede dormir el API tras un periodo sin tráfico, por lo que la primera petición puede ser lenta.

---

## 1. Crear PostgreSQL en Neon

1. Crea una cuenta en Neon y un proyecto PostgreSQL gratuito.
2. Para menor latencia desde Ecuador y el backend de Render configurado en Virginia, selecciona una región de US East si está disponible.
3. Copia la cadena de conexión PostgreSQL **con SSL**.
4. No publiques esta cadena en GitHub.

GarageFlow acepta ahora una sola variable:

```env
DATABASE_URL=postgresql://USER:PASSWORD@HOST/DATABASE?sslmode=require
DB_SSL=true
DB_POOL_MAX=5
```

El pool se limita a 5 conexiones para mantener pequeño el consumo de una demo.

---

## 2. Crear almacenamiento en Cloudinary

1. Crea una cuenta Free de Cloudinary.
2. Obtén del panel:
   - Cloud name
   - API key
   - API secret
3. Guárdalos únicamente como secretos en Render.

Variables:

```env
MEDIA_STORAGE=cloudinary
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
```

En local puedes seguir usando:

```env
MEDIA_STORAGE=local
```

Las imágenes locales se guardan en `uploads/evidence`. En Render Free **no** debe utilizarse `local`, porque el filesystem es efímero.

---

## 3. Subir GarageFlow a GitHub

Publica la carpeta `garageflow-platform` como repositorio.

Antes del push verifica:

```bash
git status
git grep -n "DATABASE_URL=" -- ':!*.example'
git grep -n "CLOUDINARY_API_SECRET" -- ':!*.example' ':!render.yaml'
```

No subas `.env`, passwords, claves de Cloudinary ni el connection string de Neon.

---

## 4. Desplegar con Render Blueprint

El repositorio incluye `render.yaml`, que crea:

- `garageflow-portfolio-api` — NestJS Web Service Free
- `garageflow-portfolio-app` — React Static Site

En Render:

1. New → Blueprint.
2. Conecta el repositorio de GitHub.
3. Render detectará `render.yaml`.
4. Durante la creación, ingresa los secretos solicitados:
   - `DATABASE_URL`
   - `CLOUDINARY_CLOUD_NAME`
   - `CLOUDINARY_API_KEY`
   - `CLOUDINARY_API_SECRET`
   - `SEED_ADMIN_PASSWORD`
5. Despliega el Blueprint.

`JWT_SECRET` se genera automáticamente por Render y no se guarda en el repositorio.

### Si los nombres ya están ocupados

El Blueprint usa estas URLs previstas:

```text
https://garageflow-portfolio-api.onrender.com
https://garageflow-portfolio-app.onrender.com
```

Si Render obliga a usar nombres diferentes, actualiza:

Backend:

```env
CORS_ORIGIN=https://TU-FRONTEND.onrender.com
```

Frontend:

```env
VITE_API_URL=https://TU-API.onrender.com/api/v1
VITE_WS_URL=https://TU-API.onrender.com/workshop
```

Después redepliega ambos servicios.

---

## 5. Migraciones en el plan Free

Render reserva su comando de pre-deploy para servicios de pago. Por eso esta variante utiliza:

```json
"start:render": "npm run migration:run:prod && npm run seed:prod && node dist/main.js"
```

Cuando inicia el backend:

1. TypeORM revisa la tabla de migraciones.
2. Ejecuta únicamente migraciones pendientes.
3. Ejecuta el seed sólo si `SEED_ENABLED=true`.
4. Inicia NestJS.

La instancia Free es única, por lo que este mecanismo es apropiado para una demo. Para producción real conviene mover las migraciones a una etapa de despliegue controlada.

---

## 6. Seed de demostración

Para una demo pública se permite seed en producción únicamente cuando:

```env
DEMO_MODE=true
SEED_ENABLED=true
```

El seed es idempotente: no duplica el administrador ni recrea el catálogo si ya existe.

Para un entorno real:

```env
DEMO_MODE=false
SEED_ENABLED=false
```

No publiques el password del administrador. Si quieres entregar acceso a un reclutador, crea un usuario exclusivo para demostración con permisos limitados.

---

## 7. URLs resultantes

Con los nombres predeterminados:

```text
Aplicación:
https://garageflow-portfolio-app.onrender.com

API:
https://garageflow-portfolio-api.onrender.com/api/v1

Swagger:
https://garageflow-portfolio-api.onrender.com/docs

Health:
https://garageflow-portfolio-api.onrender.com/api/v1/health
```

---

## 8. Limitaciones de la versión $0

### Render backend

- Puede entrar en suspensión por inactividad.
- La primera solicitud después de dormir puede tardar notablemente.
- El filesystem es efímero.
- Está pensado para hobby/demos, no para disponibilidad productiva.

### Neon

- El plan gratuito tiene límites de almacenamiento y compute.
- Es suficiente para una demo de portfolio, pero debes monitorear uso si el proyecto recibe tráfico.

### Cloudinary

- El plan Free comparte una cuota de créditos entre almacenamiento, transformaciones y ancho de banda.
- Mantén el límite de 5 MB por evidencia y no utilices el sistema como repositorio masivo de fotografías.

---

## 9. Recomendaciones para una demo pública

- Mantén secretos fuera de GitHub.
- No publiques credenciales de administrador.
- Crea un usuario de demostración separado si necesitas dar acceso.
- Limpia datos personales antes de mostrar el sistema.
- Usa únicamente fotografías de prueba.
- Revisa periódicamente el consumo de Neon, Render y Cloudinary.
- Si la demo empieza a recibir usuarios reales, migra el backend a una instancia que no duerma.

---

## 10. Flujo de despliegue futuro

```text
git push
   |
   +--> Render Static Site --> build React
   |
   +--> Render API ---------> build Nest
                               |
                               +--> migrations
                               +--> optional demo seed
                               +--> start API
```

El objetivo es que una actualización normal del repositorio vuelva a desplegar ambos componentes automáticamente.

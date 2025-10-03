# ChronoList
Lista de inscripción por orden de llegada (máximo 20).

## Ejecutar
```bash
cd chronolist
npm install
npm run dev
# o en producción
ADMIN_TOKEN=pon_un_token npm start
# abre http://localhost:3000
```
## API
- `GET /api/list` → `{ items: [{id,name,createdAt,position}], total, max }`
- `POST /api/join` body `{name}` → añade si hay hueco, evita duplicados.
- `POST /api/leave` body `{name}` → elimina tu entrada.
- `POST /api/next` header `x-admin-token` → saca al primero.
- `POST /api/reset` header `x-admin-token` → vacía la lista.

DB: SQLite `queue.db`. Cambia `ADMIN_TOKEN` por una secreta en producción.


## Despliegue rápido

### Opción A) Docker (local o servidor)
```bash
# 1) Construye la imagen
docker build -t chronolist .

# 2) Arranca el contenedor
docker run --name chronolist -p 3000:3000 \
  -e ADMIN_TOKEN=pon_un_token \
  -v $(pwd)/queue.db:/app/queue.db \
  chronolist
# Abre http://localhost:3000
```

Con **docker-compose**:
```bash
docker compose up -d --build
# Panel en http://localhost:3000
```

### Opción B) Render.com (gratis)
1. Sube este repo a GitHub.
2. En Render → “New +” → “Web Service” → conecta tu repo.
3. Build: `npm install` — Start: `npm start` — Health check: `/health`
4. Añade env var `ADMIN_TOKEN`.
5. Deploy.

> Hay `render.yaml` para infra como código; si lo usas, Render lo detecta al crear el servicio.

### Opción C) Railway.app
1. Nuevo proyecto → “Deploy from Repo” o “Dockerfile”.
2. Variables: `ADMIN_TOKEN`, `PORT=3000` (opcional).
3. Deploy. Railway detecta el `Dockerfile`.

### Opción D) Fly.io
```bash
# Requisitos: flyctl instalado
fly launch  # contesta las preguntas; generará el fly.toml
fly secrets set ADMIN_TOKEN=pon_un_token
fly deploy
```

### Opción E) Heroku (contigo plan actual)
```bash
heroku create
heroku config:set NODE_ENV=production ADMIN_TOKEN=pon_un_token
git push heroku main
```

> SQLite persiste en un archivo (`queue.db`). En PaaS efímeros, usa un **volume** (Docker) o un **persistent disk** del proveedor para no perder la cola al reiniciar. En Render puedes activar “Disk” en el servicio y montar `/app/queue.db`.

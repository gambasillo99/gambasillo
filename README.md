# 🦐 Gambasillo

Red social privada minimalista para una pequeña comunidad de amigos.

## Stack

- **Next.js 15** + React 19 + TypeScript
- **TailwindCSS** — UI oscura underground
- **Supabase** — PostgreSQL + API backend
- **Cloudinary** — multimedia en posts
- **localStorage** — fallback sin configurar Supabase

## Inicio rápido (modo local)

```bash
npm install
npm run dev
```

Sin variables de entorno, la app usa `localStorage` vacío: crea tu cuenta y empieza a gambear.

---

## Conectar Supabase

### 1. Crear proyecto

1. [supabase.com](https://supabase.com) → New project
2. Copia **Project URL**, **anon key** y **service_role key**

### 2. Ejecutar schema

En **SQL Editor**, pega y ejecuta el contenido de [`supabase/schema.sql`](supabase/schema.sql).

### 3. Variables de entorno

Copia `.env.example` → `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
SESSION_SECRET=genera-un-secreto-aleatorio-largo
```

### 4. Arrancar

```bash
npm run dev
```

Regístrate con tu @usuario y contraseña. La base empieza vacía (sin datos demo).

---

## Conectar Cloudinary

1. [cloudinary.com](https://cloudinary.com) → Dashboard
2. Copia **Cloud name**, **API Key**, **API Secret**
3. Añade a `.env.local`:

```env
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=tu-cloud
CLOUDINARY_CLOUD_NAME=tu-cloud
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
```

Las imágenes/vídeos/audios del composer se suben a la carpeta `gambasillo/` en Cloudinary.

---

## Arquitectura

```
Cliente (React)
    ↓ fetch /api/*
API Routes (Next.js) — sesión httpOnly cookie
    ↓ service_role
Supabase PostgreSQL
```

| Sin Supabase | Con Supabase |
|--------------|--------------|
| localStorage | PostgreSQL |
| Sesión local | Cookie JWT httpOnly |
| Blob URLs    | Cloudinary (opcional) |

## Páginas

| Ruta | Descripción |
|------|-------------|
| `/login` | Inicio de sesión |
| `/register` | Registro |
| `/feed` | Feed principal |
| `/profile/[username]` | Perfil |
| `/post/[id]` | Post + comentarios |
| `/notifications` | Notificaciones |

## Scripts

```bash
npm run dev      # desarrollo
npm run build    # producción
npm run start    # servidor prod
```

---

Hecho con 🦐 para el club privado.

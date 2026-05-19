# Guía paso a paso — Gambasillo

Esta guía te lleva desde cero hasta tener la app funcionando con **Supabase** y **Cloudinary** (opcional).

---

## Parte 0 — Requisitos en tu PC

### 0.1 Instalar Node.js (si no lo tienes)

1. Entra en [https://nodejs.org](https://nodejs.org)
2. Descarga la versión **LTS** (recomendada)
3. Instala con las opciones por defecto (incluye **npm**)
4. Abre una **nueva** terminal PowerShell y comprueba:

```powershell
node --version
npm --version
```

Deberías ver algo como `v22.x.x` y `10.x.x`.

### 0.2 Abrir el proyecto

```powershell
cd "c:\Users\Becario\Desktop\Proyectos\OTro\X"
```

---

## Parte 1 — Probar en local (sin Supabase)

Útil para ver la UI antes de configurar la nube.

### 1.1 Instalar dependencias

```powershell
npm install
```

### 1.2 Arrancar la app

```powershell
npm run dev
```

### 1.3 Abrir en el navegador

[http://localhost:3000](http://localhost:3000)

### 1.4 Iniciar sesión con usuario demo

| Campo        | Valor       |
|--------------|-------------|
| @usuario     | `marina`    |
| Contraseña   | `gambas123` |

También puedes usar `pixel` o `nexus` con la misma contraseña.

> En este modo los datos se guardan en el **localStorage** del navegador (no en la nube).

---

## Parte 2 — Configurar Supabase

### 2.1 Crear cuenta y proyecto

1. Ve a [https://supabase.com](https://supabase.com) y regístrate
2. Clic en **New project**
3. Elige:
   - **Name:** `gambasillo` (o el que quieras)
   - **Database password:** anótala en un sitio seguro
   - **Region:** la más cercana (ej. `West EU`)
4. Clic en **Create new project** y espera 1–2 minutos

### 2.2 Crear las tablas en la base de datos

1. En el panel de Supabase, menú izquierdo → **SQL Editor**
2. Clic en **New query**
3. Abre el archivo del proyecto: `supabase/schema.sql`
4. Copia **todo** el contenido y pégalo en el editor SQL
5. Clic en **Run** (o Ctrl+Enter)
6. Debe aparecer **Success** sin errores

### 2.3 Copiar las claves de API

1. Menú izquierdo → **Project Settings** (engranaje)
2. Entra en **API**
3. Copia y guarda estos tres valores:

| En Supabase              | Variable en `.env.local`              |
|--------------------------|----------------------------------------|
| Project URL              | `NEXT_PUBLIC_SUPABASE_URL`             |
| anon public              | `NEXT_PUBLIC_SUPABASE_ANON_KEY`        |
| service_role (secret)    | `SUPABASE_SERVICE_ROLE_KEY`            |

> **Importante:** la `service_role` es secreta. No la subas a GitHub ni la compartas.

### 2.4 Crear el archivo de entorno

En la raíz del proyecto (`X`):

1. Copia el ejemplo:

```powershell
Copy-Item .env.example .env.local
```

2. Abre `.env.local` con el editor y rellena:

```env
NEXT_PUBLIC_SUPABASE_URL=https://TU-PROYECTO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIs...
SESSION_SECRET=cambia-esto-por-algo-largo-y-aleatorio-32chars-min
```

**SESSION_SECRET:** inventa una cadena larga (puedes usar [randomkeygen.com](https://randomkeygen.com) → CodeIgniter Encryption Keys).

### 2.5 Reiniciar la app

```powershell
# Para el servidor (Ctrl+C) y vuelve a arrancar:
npm run dev
```

### 2.6 Cargar datos de prueba (seed)

**Opción A — Automática:** al abrir la app, si la base está vacía, se llama al seed solo.

**Opción B — Manual** (con la app corriendo):

```powershell
curl -X POST http://localhost:3000/api/seed
```

O en el navegador instala una extensión REST Client, o usa Postman: `POST http://localhost:3000/api/seed`

### 2.7 Probar login con Supabase

1. Abre [http://localhost:3000/login](http://localhost:3000/login)
2. Usuario: `marina` — Contraseña: `gambas123`
3. Deberías entrar al feed con posts de demo

### 2.8 Comprobar que usa Supabase (no localStorage)

1. En Supabase → **Table Editor** → tabla `users`
2. Deberías ver filas con `marina`, `pixel`, `nexus`
3. Crea un post en la app → revisa la tabla `posts`

---

## Parte 3 — Configurar Cloudinary (multimedia)

Opcional. Sin esto, las fotos/vídeos se ven en local pero no se guardan en la nube.

### 3.1 Crear cuenta

1. [https://cloudinary.com](https://cloudinary.com) → Sign up (plan gratis vale)
2. En el **Dashboard** anota:
   - **Cloud name**
   - **API Key**
   - **API Secret**

### 3.2 Añadir variables a `.env.local`

```env
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=tu-cloud-name
CLOUDINARY_CLOUD_NAME=tu-cloud-name
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=tu-api-secret
```

### 3.3 Reiniciar

```powershell
npm run dev
```

### 3.4 Probar subida

1. Entra al feed
2. Crea un post con una **imagen**
3. En Cloudinary → **Media Library** → carpeta `gambasillo`
4. Debería aparecer el archivo subido

---

## Parte 4 — Registro de un usuario nuevo

1. Ve a [http://localhost:3000/register](http://localhost:3000/register)
2. @usuario: solo letras minúsculas, números y `_` (3–20 caracteres)
3. Contraseña: mínimo 6 caracteres
4. Tras registrarte entras al feed automáticamente

---

## Parte 5 — Desplegar en producción (opcional)

### Vercel (recomendado)

1. Sube el proyecto a GitHub
2. [vercel.com](https://vercel.com) → Import project
3. En **Environment Variables** añade las mismas que en `.env.local`
4. Deploy

En producción **obligatorio** usar un `SESSION_SECRET` fuerte y distinto al de desarrollo.

---

## Resumen rápido

```
[ ] Node.js instalado (node -v, npm -v)
[ ] npm install
[ ] Proyecto Supabase creado
[ ] schema.sql ejecutado en SQL Editor
[ ] .env.local con URL, anon, service_role, SESSION_SECRET
[ ] npm run dev
[ ] Login @marina / gambas123
[ ] (Opcional) Cloudinary en .env.local
[ ] (Opcional) Post con imagen → Media Library
```

---

## Problemas frecuentes

### `npm` no se reconoce

- Instala Node.js LTS y **cierra y abre** la terminal.

### Error 503 "Supabase no configurado"

- Falta `SUPABASE_SERVICE_ROLE_KEY` en `.env.local`
- Reinicia `npm run dev` después de editar `.env.local`

### Login falla con Supabase

- Comprueba que ejecutaste `schema.sql`
- Ejecuta el seed: `POST /api/seed`
- Revisa en Table Editor que existen usuarios

### Las imágenes no suben

- Revisa las 4 variables de Cloudinary
- `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` debe coincidir con `CLOUDINARY_CLOUD_NAME`
- Reinicia el servidor de desarrollo

### Sigo viendo datos viejos

- Sin Supabase: borra datos del sitio en DevTools → Application → Local Storage
- Con Supabase: los datos están en la nube; borra filas desde Table Editor si quieres empezar de cero

---

¿Dudas? Revisa también [README.md](./README.md).

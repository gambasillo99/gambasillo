# Publicar Gambasillo en Netlify (link para todos)

Tu app quedará en un link público tipo:

`https://gambasillo.netlify.app`

(o el nombre que elijas en Netlify)

---

## Requisitos

- Cuenta en [netlify.com](https://www.netlify.com) (gratis)
- Código en **GitHub** (recomendado) o subida manual
- Las mismas variables que en tu `.env.local`

---

## Paso 1 — Subir el código a GitHub

Si aún no lo tienes en GitHub:

1. [github.com](https://github.com) → **New repository** → nombre `gambasillo`
2. En PowerShell:

```powershell
cd "c:\Users\Becario\Desktop\Proyectos\OTro\X"
git init
git add .
git commit -m "Gambasillo"
git branch -M main
git remote add origin https://github.com/TU-USUARIO/gambasillo.git
git push -u origin main
```

---

## Paso 2 — Crear el sitio en Netlify

1. Entra en [app.netlify.com](https://app.netlify.com)
2. **Add new site** → **Import an existing project**
3. **Deploy with GitHub** → autoriza Netlify
4. Elige el repositorio **gambasillo**

Netlify detectará Next.js gracias a `netlify.toml` (ya está en el proyecto).

**No despliegues todavía** si puedes configurar variables antes — si ya desplegó, las añades y redeploy.

---

## Paso 3 — Variables de entorno

En Netlify: **Site configuration** → **Environment variables** → **Add a variable**

Añade **todas** estas (copia los valores de tu `.env.local`):

| Key | Notas |
|-----|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon public |
| `SUPABASE_SERVICE_ROLE_KEY` | Secreto — no compartir |
| `SESSION_SECRET` | Con comillas si tiene `#` o `$` |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | `dlcxrynog` |
| `CLOUDINARY_CLOUD_NAME` | Igual que la anterior |
| `CLOUDINARY_API_KEY` | |
| `CLOUDINARY_API_SECRET` | Secreto |

Marca el scope **All** (o al menos **Production**).

---

## Paso 4 — Deploy

1. **Deploy site** (o **Trigger deploy** → **Deploy project**)
2. Espera 3–5 minutos en **Deploy log**
3. Cuando ponga **Published**, clic en el link del sitio

---

## Paso 5 — Datos de prueba (seed)

Abre en el navegador (cambia por tu URL):

```
https://TU-SITIO.netlify.app/api/seed
```

Deberías ver algo como `{"ok":true}`.

Comprueba en Supabase → **Table Editor** → `users`.

---

## Paso 6 — Compartir

Envía el link a tus amigos:

```
https://TU-SITIO.netlify.app
```

- Registro: `/register`
- Demo: usuario `marina` / contraseña `gambas123`

---

## Cambiar el nombre del link

**Site configuration** → **Domain management** → **Options** junto a `*.netlify.app`

→ **Edit site name** → por ejemplo `gambasillo` → queda `https://gambasillo.netlify.app`

---

## Redesplegar tras cambios

Cada `git push` a `main` puede redeployar solo si conectaste GitHub.

O en Netlify: **Deploys** → **Trigger deploy** → **Deploy project**.

---

## Opción B — Netlify CLI (sin GitHub)

```powershell
cd "c:\Users\Becario\Desktop\Proyectos\OTro\X"
npm install
npx netlify login
npx netlify init
```

Sigue el asistente (crear sitio nuevo).

Añade variables en la web de Netlify (Paso 3), luego:

```powershell
npx netlify deploy --prod
```

---

## Problemas frecuentes

| Problema | Solución |
|----------|----------|
| Build falla | En local: `npm run build`. Corrige errores antes |
| Login no funciona | Revisa las 4 variables de Supabase + `SESSION_SECRET` |
| 503 Supabase | Falta `SUPABASE_SERVICE_ROLE_KEY` en Netlify |
| Fotos no suben | Variables Cloudinary + redeploy |
| Sitio vacío | Visita `/api/seed` una vez |

---

## Archivos de configuración del proyecto

- `netlify.toml` — build y plugin Next.js
- `@netlify/plugin-nextjs` — API routes y App Router en Netlify

No necesitas cambiar código para Netlify si ya funciona en local con `.env.local`.

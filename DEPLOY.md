# Publicar Gambasillo en internet (link para todos)

La forma más fácil es **Vercel** (gratis, hecho para Next.js).

Tu link quedará así: `https://gambasillo.vercel.app` (o el nombre que elijas).

---

## Opción A — Vercel desde el navegador (recomendada)

### 1. Subir el código a GitHub

1. Crea cuenta en [github.com](https://github.com) si no tienes
2. Clic en **+** → **New repository**
3. Nombre: `gambasillo` → **Create repository** (vacío, sin README)

En PowerShell, en la carpeta del proyecto:

```powershell
cd "c:\Users\Becario\Desktop\Proyectos\OTro\X"
git init
git add .
git commit -m "Gambasillo MVP"
git branch -M main
git remote add origin https://github.com/TU-USUARIO/gambasillo.git
git push -u origin main
```

(Sustituye `TU-USUARIO` por tu usuario de GitHub.)

### 2. Conectar con Vercel

1. [vercel.com](https://vercel.com) → **Sign up** (con GitHub)
2. **Add New…** → **Project**
3. Importa el repo `gambasillo`
4. **Framework Preset:** Next.js (detectado solo)
5. **NO pulses Deploy todavía** → abre **Environment Variables**

### 3. Pegar las mismas variables que en `.env.local`

Copia una por una (Production + Preview + Development):

| Name | Value |
|------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://pocvuqcnjffpetdquxer.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | (tu anon key) |
| `SUPABASE_SERVICE_ROLE_KEY` | (tu service role) |
| `SESSION_SECRET` | (tu session secret, con comillas si tiene `#`) |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | `dlcxrynog` |
| `CLOUDINARY_CLOUD_NAME` | `dlcxrynog` |
| `CLOUDINARY_API_KEY` | (tu api key) |
| `CLOUDINARY_API_SECRET` | (tu api secret) |

6. Clic en **Deploy**
7. Espera 2–3 minutos → te dará el **link público**

### 4. Datos de prueba en producción

Abre en el navegador (sustituye por tu URL):

```
https://TU-APP.vercel.app/api/seed
```

O en PowerShell:

```powershell
curl -X POST https://TU-APP.vercel.app/api/seed
```

### 5. Compartir el link

Envía a tus amigos:

```
https://TU-APP.vercel.app
```

Pueden **registrarse** en `/register` o usar demo: `marina` / `gambas123`

---

## Opción B — Vercel desde la terminal (sin GitHub)

```powershell
cd "c:\Users\Becario\Desktop\Proyectos\OTro\X"
npx vercel login
npx vercel
```

Responde las preguntas (Enter para aceptar defaults).

Luego añade variables de entorno en [vercel.com](https://vercel.com) → tu proyecto → **Settings** → **Environment Variables** (las mismas de arriba).

Despliegue a producción:

```powershell
npx vercel --prod
```

---

## Después del deploy

- Cada `git push` a `main` puede redeployar solo (si usaste GitHub)
- El link es **HTTPS** automático
- `.env.local` **no** se sube a GitHub (está en `.gitignore`) — por eso las variables van en Vercel

## Problemas frecuentes

| Problema | Solución |
|----------|----------|
| Login no funciona | Variables en Vercel + redeploy. `SESSION_SECRET` en Production |
| Base vacía | Visita `https://tu-app.vercel.app/api/seed` una vez |
| Error al subir fotos | Revisa variables Cloudinary en Vercel |
| Build falla | `npm run build` en local y corrige errores antes |

---

## Seguridad (club privado de amigos)

La app es pública por URL: cualquiera con el link puede registrarse. Para un grupo cerrado:

- No compartas el link en sitios públicos
- Cambia la contraseña demo después del primer día
- Rota claves que hayas pegado en chats

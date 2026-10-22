# Star Conectados — app móvil

Canal de atención al cliente. Expo + React Native. No usa Meta ni el inbox de asesores (`/api/crm/*`).

## Variables de entorno

Copia `.env.example` a `.env` en `apps/mobile`. `app.config.js` carga ese archivo al arrancar (Metro y EAS local).

| Variable | Uso |
| --- | --- |
| `EXPO_PUBLIC_API_URL` | Base de Innover-Flow. Producción: `https://innover-flow.vercel.app`. |
| `EXPO_PUBLIC_APP_CHANNEL_SECRET` | Secreto de canal para `POST /api/app/session` (`x-app-secret`). Debe coincidir con Vercel. **No lo subas a git.** El usuario nunca lo escribe. |

El login no pide `organization_slug`. Realtime no usa `EXPO_PUBLIC_SUPABASE_*`: el JWT llega en `login.realtime`.

## Arranque

Desde la raíz del monorepo:

```bash
pnpm --filter mobile dev
```

## APK para el teléfono (sin Metro)

El build se hace **desde `apps/mobile`**, no desde la raíz. El perfil `preview` genera un APK interno: abre solo, sin `expo start`.

1. En [expo.dev](https://expo.dev) → proyecto Star Conectados / Innover → **Environment variables** → entornos `preview` y `production`, crea `EXPO_PUBLIC_APP_CHANNEL_SECRET` (el mismo de Vercel). Sin eso el login en el APK falla.
2. Desinstala el APK anterior de Star Conectados / Innover (el development build incompleto).
3. Desde `apps/mobile`:

```bash
pnpm dlx eas-cli login
pnpm build:android:preview
```

O desde la raíz: `pnpm build:android:preview`.

Cuando EAS termine, abre el enlace, descarga el `.apk` e instálalo (orígenes desconocidos). No uses Expo Go ni `expo start`.

Los botones de simular aviso no salen en este APK (`__DEV__` apagado). La app de cliente (login, chat, facturación) sí.

El splash nativo (fondo blanco + logo Star Conectados) lo define
`expo-splash-screen` en `app.json` (`assets/splash.png`). Cambiar la imagen
exige un APK nuevo.

## Flujo

1. Login → `POST /api/app/session` (`x-app-secret` + cédula/clave). Token 30 días en SecureStore.
2. Chat → `GET/POST /api/app/messages`. Catch-up `?after_id=`. Media: multipart `file` + `media_type`.
3. Vivo → Supabase `postgres_changes` con `GET /api/app/realtime-token`. Si Realtime no está: polling 5 s.
4. Tickets → `GET /api/app/tickets` (lista y `:id`). El cliente no crea tickets.
5. Push → `POST /api/app/devices` cuando hay token Expo/FCM.
6. `SESSION_EXPIRED` / 401 autenticado → logout.

Sin red la UI muestra «Sin conexión». Siempre se muestra `body.error` del API.

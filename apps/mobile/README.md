# Innover Flow — app móvil

Canal de atención al cliente. Expo + React Native. No usa Meta ni el inbox de asesores (`/api/crm/*`).

## Variables de entorno

Copia `.env.example` a `.env` en `apps/mobile`:

| Variable | Uso |
| --- | --- |
| `EXPO_PUBLIC_API_BASE_URL` | Base del CRM. Dev: `http://localhost:3000`. Producción: `https://<DOMINIO-DEL-CRM>`. |
| `EXPO_PUBLIC_ORGANIZATION_SLUG` | Slug white-label. Si va vacío, el login pide el identificador. |
| `EXPO_PUBLIC_APP_CHANNEL_SECRET` | Secreto de canal para `POST /api/app/session` (`x-app-secret`). **No lo subas a git.** Expo lo embebe en el binario: en producción conviene un BFF. |

No hay dominio ni slug inventados en el código.

## Arranque

Desde la raíz del monorepo:

```bash
pnpm --filter mobile dev
```

## Flujo

1. Login → `POST /api/app/session`
2. Chat → `GET/POST /api/app/messages` (texto, imagen, audio)
3. Polling cada 4 s + pull-to-refresh
4. Push: `POST /api/app/devices` cuando exista token FCM/APNs (hoy es stub)

Si un request autenticado responde 401, se borra la sesión y vuelve el login.

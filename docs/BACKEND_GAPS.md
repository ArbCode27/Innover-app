# Huecos de backend para la app móvil

Canal de cliente en producción: `https://innover-flow.vercel.app/api/app/*`
(`session`, `me`, `billing`, `contracts`, `payments`, `messages`, `tickets`,
`devices`, `realtime-token`). La app **no** usa `/api/crm/*`.
`EXPO_PUBLIC_APP_CHANNEL_SECRET` debe coincidir con el de Vercel o el login
responde 401 «Secret de app inválido».

Fuente inspeccionada: Innover-Flow (`C:\Users\Oficce\Documents\Innover-Flow`)
para saldo Wispro, contratos, `crm_payments` y FAQ. No se fingen 200 de
`/api/app/*`.

## esto no existe en el CRM; hay que crearlo

### 0. Canal Innover Flow (`/api/app/session`, `/me`, `/billing`, `/contracts`, `/payments`, `/messages`, `/tickets`, `/devices`, `/realtime-token`)

- **Estado en producción / repo Innover-Flow:** rutas `/api/app/*`.
  Login cédula + clave (`x-app-secret`), JWT 30 días, perfil/billing/contratos/
  pagos, chat texto/media, tickets de campo, registro de dispositivo y JWT
  de Supabase Realtime (`login.realtime` + `GET /api/app/realtime-token`).
  Desplegar Innover-Flow para que Vercel exponga `me`/`billing`/`contracts`/
  `payments`.
- **App:** `src/lib/api-client.ts` pega a esas rutas. Errores `{ error, code }`.
  `SESSION_EXPIRED` / 401 cierran sesión (salvo `WRONG_PASSWORD` e
  `INVALID_SECRET` en login). Sin red: «Sin conexión».
- **Realtime:** cliente Supabase con `login.realtime` (`setAuth(access_token)`,
  `persistSession: false`). Canal `app:{conversationId}:{clientId}`. Catch-up
  `GET /messages?after_id=` al foreground y `CHANNEL_ERROR`. Si `realtime`
  es null o 503, el chat hace polling REST cada 10 s mientras está abierto.
  Al volver a foreground se renueva el JWT si faltan < 10 min y se
  resubscribe si el canal murió.
- **Notas internas** (`type=note`) se ocultan. Ubicación se envía como texto
  porque el POST no acepta lat/long.
- **Push (app):** tras login / sesión / resume pide permiso, obtiene
  `ExponentPushToken` con `eas.projectId`, canales `star-chat` /
  `star-ticket`, y `POST /api/app/devices` con reintentos. Expo Go y web
  no registran. Logs `[push]` / `[push:register]` también en APK release
  (Logcat). Si el registro falla tras login, Alert con el motivo
  (`permission_denied`, `token_error`, HTTP, etc.).
  Tap: `chat_message` → Chat; `field_ticket` → Mi ticket (también cold start).
- **Push (CRM):** el envío a Expo Push al `type=out` / INSERT de ticket
  vive en Innover-Flow. Si `app_devices` está vacío, el CRM no tiene a
  quién empujar: hay que instalar APK EAS (no Expo Go), aceptar permiso
  y verificar fila en `app_devices`.

### 0b. Push de mensaje de chat (`type=out` → Expo Push)

- **Estado en Innover Flow:** el CRM envía Expo Push al persistir
  `type=out` (canal app). La app registra el token en `app_devices`.
- **App:** `registerPushIfPossible` + listeners. Silencia banner de chat
  si Chat está enfocado. Tap abre Chat + catch-up.
- **Contrato data:** `{ kind: "chat_message", conversationId, messageId,
  direction: "out" }`, `channelId: "star-chat"`.

### 0c. Push de ticket de campo (`field_tickets` INSERT → Expo Push)

- **Estado en Innover Flow:** el CRM envía Expo Push al INSERT de ticket
  de campo. La app también avisa por Realtime si está abierta.
- **App:** aviso local en INSERT Realtime + handler remoto
  `kind=field_ticket`, canal `star-ticket`. Tap abre Mi ticket.
- **Contrato data:** `{ kind: "field_ticket", ticketId, publicId, title?,
  conversationId }`.

### 1. Login de abonado (cédula + clave)

- **Estado en producción:** `POST /api/app/session` con `x-app-secret` +
  `{ action: "login", cedula, password }`. La clave es dígitos de cédula + iniciales.
- **App:** `session-gateway.ts` llama al API. No pide `organization_slug`.
  No hay login por teléfono ni «solicitar clave». El registro opcional
  (`action: register`) no es el flujo principal y no está en la UI.

### 1b. Avisos de red al abonado (`GET /api/app/notices` + FCM)

- **Estado en CRM:** **esto no existe en el CRM; hay que crearlo**. No hay
  catálogo de avisos de corte / potencia / trabajo en zona / restablecido.
- **Mock en la app:** `service-notice-gateway.ts` + store de UI. Los 4
  botones de simulación solo aparecen en `__DEV__`. La campana y el estado
  de conexión leen el mismo aviso. «Mostrar en el teléfono» dispara una
  notificación **local** (  `expo-notifications`); no es FCM. En Expo Go
  (Android SDK 53+) no se importa ese módulo: falta
  `ExpoTopicSubscriptionModule`. El APK de EAS se genera desde
  `apps/mobile` (`pnpm build:android:preview`): perfil `preview`,
  JS embebido, sin Metro. Un build desde la raíz del monorepo no
  enlaza `react-native-gesture-handler` y arranca en rojo.
- **Propuesta mínima:** `GET /api/app/notices` con `{ id, kind, severity,
  title, body, created_at }` y push FCM `data.kind`. La app no inventa el
  copy en producción.

### 2. Resolución de perfil desde el JWT

- **Estado en CRM:** no existen `profiles` / `app_users`. Técnicos y supervisores se resuelven por last10 de WhatsApp.
- **Mock:** el gateway de auth devuelve `AppRole` (`customer` | `technician` | `supervisor`).
- **Propuesta mínima:** `app_profiles` (un rol por usuario) + RPC `app_my_profile()`.

### 3. Marca de canal en `conversations`

- **Estado en CRM:** no hay `conversations.channel` ni `messages.metadata.channel`. Hay una conversación activa por `client_id`.
- **Mock:** el chat asume canal `app` en memoria.
- **Propuesta mínima:** `channel text CHECK ('whatsapp','app')` + índice único `(client_id, channel)` en hilos abiertos.

### 4. Ingreso `channel=app` hacia Nova (sin Graph / Meta)

- **Estado en Innover-Flow:** `POST /api/app/messages` escribe el `type=in` y,
  si `human_mode === false`, la IA responde en background. La respuesta
  **no** viene en el POST: llega por Realtime (`INSERT type=out`) o por GET.
- **CRM sibling (innovercorp):** `replyToConversationWithAi` sigue atado a
  Graph / Meta. No se llama desde esta app.
- **Aislamiento legado:** `src/lib/channel-app-ingress.ts` con
  `TODO(channel=app)` (solo el mock de `chat-gateway.ts`, no el canal REST).

### 5. Cotización de saldo / perfil / contratos / pagos (app)

- **Estado en Innover-Flow:** implementado.
  - `GET /api/app/me` (+ `?refresh=1`) — perfil enriquecido + resumen billing.
  - `GET /api/app/billing` (+ `?refresh=1`) — deuda formateada VE, facturas
    pendientes Wispro, `billing_stale`, horario de oficina.
  - `GET /api/app/contracts` — contratos Wispro / empty si no hay `wispro_id`.
  - `GET /api/app/payments` — historial `crm_payments` del `client_id` de sesión.
  - `POST /api/app/session` — `client` enriquecido (account, plan, zone, debt…).
- **App:** `account-quote-gateway`, `payments-gateway`, Home / Facturación /
  Contrato leen esos endpoints. Sin mocks de saldo/plan/factura.
- **Pendiente:** `POST /api/app/payments` para reportar pago con comprobante
  (hoy el intake es chat → Nova → `intakeCrmReceipt`; no hay `source: "app"`).

### 5b. Instrucciones de pago (banco destino, RIF, teléfono, métodos)

- **Estado en CRM:** **esto no existe en el CRM; hay que crearlo**. No hay endpoint JWT ni tabla de datos bancarios de cobro (Pago Móvil, transferencia, depósito, depósito USD) para la app. Nova tampoco inyecta cuenta/teléfono/RIF desde `crm_settings`.
- **App:** `payment-instructions-gateway.ts` usa montos reales de `/billing`.
  No inventa banco/RIF/teléfono: indica solicitar datos por el chat.
- **Propuesta mínima:** `GET /api/app/payment-instructions` con métodos y campos ya formateados (`bank_name`, `rif`, `phone`, `amount_line`, `updated_at_label`). La app no calcula Bs ni tasa BCV.

### 6. Bucket de adjuntos y políticas

- **Estado en CRM:** bucket de facto `whatsapp-media`, uploads con service role. Sin políticas en el repo. **`app-attachments` no existe.**
- **Mock:** `src/features/chat/attachments-gateway.ts` intenta subir si hay anon key; si el bucket o RLS fallan, deja el `file://` local y el mensaje vive en memoria. **esto no existe en el CRM; hay que crearlo**
- **Propuesta mínima:** bucket privado `app-attachments` + RLS por `auth.uid()`. Paths `{user_id}/{timestamp}.{ext}`.

### 7. RLS por rol y ocultar `type='note'`

- **Estado en CRM:** cero `CREATE POLICY` en el repo. `loadMessages` y Nova leen notas internas.
- **Mock:** el chat gateway nunca emite `type='note'`.
- **Propuesta mínima:** policies JWT; `messages` SELECT `type <> 'note'` y solo hilo `channel='app'` del perfil.

### 8. INSERT de mensajes channel=app (comprobante, audio, ubicación)

- **Estado en CRM:** el webhook de Meta inserta `messages`. No hay endpoint JWT de app. La conversación mock `9001` no se persiste (evitar FK / hilo ajeno).
- **Mock:** `sendClientDraft` arma el payload real (`type='in'`, `sender_type='client'`, `metadata.channel='app'`, `media_type`, `media_url`, lat/long) y solo inserta si hay conversación real.
- **Propuesta mínima:** el ingreso `channel=app` (ítem 4) debe persistir y disparar Nova. Entonces el comprobante aparece en el CRM con su `client_id`.

### 9. Ticket del cliente (`GET /api/app/tickets`)

- **Estado en producción:** listado y detalle (`:id` UUID o `public_id`).
  El cliente no crea tickets.
- **App:** `ticket-gateway.ts` mapea labels de status/prioridad/tipo.
  Inicio muestra la visita `open,scheduled` si existe. Mi ticket lista
  todos, pinta el status/resolución del servidor (sin stepper inventado)
  y abre `maps_url` si existe. Un INSERT por Realtime avisa al cliente.

### 10. Contrato: titular, cédula, IP

- **Estado en Innover-Flow:** `clients.cedula` existe. `GET /api/app/contracts`
  devuelve titular, cédula, plan/PPP, estado (`enabled|alerted|…` → labels ES)
  y `pppoe_username`. **IP no está** en el contrato Wispro tipado → `null`.
- **App:** Contrato / Home no inventan IP ni número FTTH de ejemplo.

### 11. RLS de técnico en `crm_wispro_casos`

- **Estado en CRM:** `ENABLE ROW LEVEL SECURITY` sin ningún `CREATE POLICY`. El service role del CRM bypasea RLS. **esto no existe en el CRM; hay que crearlo**
- **Mock:** `technician-gateway` filtra siempre por `employee_id === profile.technicianId`. Un ticket `other-technician` vive en el store mock y **nunca** se lista ni se cierra. Login mock (`87654321`) no es JWT, así que no se puede «probar RLS» de verdad hasta que existan policies.
- **Propuesta mínima:** policies JWT `SELECT/UPDATE` solo si `employee_id = app_my_employee_id()`. Prohibido leer o cerrar tickets ajenos.

### 12. Cierre de visita desde la app (`resolution_observation`)

- **Estado en CRM:** `finalizeCrmWisproCaso` (service role) escribe `resolution_observation`, `status='done'`, `closed_at` y cierra Wispro. No hay `POST /api/app/tickets/close`. La transcripción de audio de cierre es de Nova en el webhook, no de la app.
- **Mock:** el gateway actualiza la fila si hay JWT + anon (`id` + `employee_id` + status abierto). Sesión mock cierra en memoria. Audio sin texto se guarda como «Nota de voz de cierre» porque **no hay transcripción channel=app**.
- **Propuesta mínima:** RPC o endpoint JWT que reutilice `finalizeCrmWisproCaso` (observación texto; audio transcrito en servidor). Wispro no se cierra desde el teléfono.

### 13. Zona en la cola

- **Estado en CRM:** no hay columna `zone` en `crm_wispro_casos`. La cola de WhatsApp usa `address_text` como ubicación.
- **Mock:** la app muestra `address_text` con etiqueta «Zona». Si viene vacío, «Sin zona».

### 14. Vista de supervisor (equipo / técnico)

- **Estado en CRM:** `listAllOpenTeamCasos` y `resolveTechnicianByName` (directorio Wispro + `crm_technicians` + casos) viven en service role. El match de nombres usa fonética y Levenshtein. **No hay endpoint JWT ni RLS de supervisor.**
- **Mock:** Equipo lee todos los `crm_wispro_casos` (o el store mock). Técnico busca **tal cual** se escribe, sin fonética ni Levenshtein. «Mis tickets» / «mi ruta» filtra `employee_id = supervisorId`. Sin acciones de cierre.
- **esto no existe en el CRM; hay que crearlo:** `GET /api/app/team-tickets` y `GET /api/app/technicians?name=` + policy `app_is_supervisor()`.

### 15. Preguntas frecuentes

- **Estado en CRM:** **esto no existe en el CRM; hay que crearlo**. No hay tabla ni endpoint JWT de FAQ para la app.
- **Mock:** `src/features/customer/faq-gateway.ts` (lista fija en español VE).
- **Propuesta mínima:** `GET /api/app/faqs` con `{ id, question, answer }` publicados por el backoffice.

### 16. Límite de 2 dispositivos

- **Estado en CRM:** **esto no existe en el CRM; hay que crearlo**. `POST /api/app/devices` del contrato es para push token, no para cupo de sesiones.
- **Mock:** `src/features/devices/devices-gateway.ts` persiste un registro por cédula en SecureStore. Si hay 2 equipos ajenos, el login no entra.
- **Propuesta mínima:**
  1. Tabla `app_devices` (`user_id`, `device_id`, `platform`, `last_seen`).
  2. Login: si `count >= 2` y `device_id` no está, responder `409 DEVICE_LIMIT` con la lista.
  3. Revocar: `DELETE /api/app/devices/:id` (el más antiguo u otro elegido).

## Discrepancias ya aplicadas en tipos de la app

- Cierre de caso: columna real `resolution_observation` (no `observation`).
- Status SQL de caso: `open` | `scheduled` | `done` | `cancelled`.
- `clients.account`: `Al día` | `Con deuda` | `Suspendido` | `Prospecto`.

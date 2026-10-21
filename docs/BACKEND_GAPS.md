# Huecos de backend para la app móvil

Canal de cliente en producción: `https://innover-flow.vercel.app/api/app/*`
(`session`, `messages`, `tickets`, `devices`). La app **no** usa `/api/crm/*`.
`EXPO_PUBLIC_APP_CHANNEL_SECRET` debe coincidir con el de Vercel o el login
responde 401 «Secret de app inválido».

Fuente inspeccionada además: CRM sibling `C:\Users\Oficce\Documents\innovercorp`
(`innover-crm`) para saldo, pagos y FAQ. No se fingen 200 de `/api/app/*`.

## esto no existe en el CRM; hay que crearlo

### 0. Canal Innover Flow (`/api/app/session`, `/messages`, `/tickets`, `/devices`, `/realtime-token`)

- **Estado en producción:** `https://innover-flow.vercel.app/api/app/*`.
  Login cédula + clave (`x-app-secret`), JWT 30 días, chat texto/media,
  tickets de campo, registro de dispositivo y JWT de Supabase Realtime
  (`login.realtime` + `GET /api/app/realtime-token`).
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
- **Push:** tras login se intenta `expo-notifications` y
  `POST /api/app/devices`. Si no hay token (Expo Go / sin projectId), se omite.
  La app silencia el banner si Chat está enfocado y, al tocar el aviso, abre
  Chat. **El envío del push al INSERT `type=out` no existe en Innover Flow;
  hay que crearlo** (Expo Push al token, `data.kind=chat_message`). Sin eso
  no hay aviso con la app cerrada.

### 0b. Push de mensaje de chat (`type=out` → Expo Push)

- **Estado en Innover Flow:** **esto no existe en el CRM; hay que crearlo**.
  `POST /api/app/devices` guarda el token. Nadie envía aviso al INSERT
  de `messages` `type=out` (Nova o asesor).
- **App:** registra el token en APK/TestFlight, silencia el banner si Chat
  está enfocado y al tocar abre Chat + catch-up. No programa notificación
  local desde Realtime (iOS mata el JS con la app cerrada).
- **Propuesta mínima:** tras persistir `type=out` de canal app, Expo Push
  al token con `{ title, body, channelId: "star-chat", data: { kind:
  "chat_message", conversationId, messageId, direction: "out" } }`.
  Nunca `type=note` ni `type=in`. Collapse por conversación.

### 0c. Push de ticket de campo (`field_tickets` INSERT → Expo Push)

- **Estado en Innover Flow:** **esto no existe en el CRM; hay que crearlo**.
  `POST /api/app/devices` guarda el token. Nadie manda Expo Push al INSERT
  de `field_tickets`. Con la app cerrada, iOS mata el JS y Realtime no
  alcanza.
- **App:** si Realtime entrega el INSERT (app abierta, incluso en Chat),
  muestra aviso local (`kind=field_ticket`, canal `star-ticket`) y al
  tocar abre Mi ticket. El handler ya acepta el mismo `data.kind` cuando
  Flow envíe el push. No se silencia si el abonado está escribiendo.
- **Propuesta mínima:** tras persistir un ticket de campo del cliente de
  canal app, Expo Push al token con `{ title, body, channelId:
  "star-ticket", data: { kind: "field_ticket", ticketId, publicId,
  conversationId } }`. Solo INSERT. Collapse por `ticketId`.

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

### 5. Cotización de saldo ya formateada

- **Estado en CRM:** `accountStatus` / `serviceSuspended` y `enrichDebtWithBcv` existen en servidor, pero no hay endpoint para la app.
- **Mock:** `src/features/customer/account-quote-gateway.ts` (strings VE fijos).
- **Propuesta mínima:** `GET /api/app/account-quote` con solo strings: `account_status`, `debt_usd_formatted`, `debt_bs_formatted`, `bcv_rate_display`, `office_closed`, `next_open_label`, `period_label`, `due_hint`.

### 5b. Instrucciones de pago (banco destino, RIF, teléfono, métodos)

- **Estado en CRM:** **esto no existe en el CRM; hay que crearlo**. No hay endpoint JWT ni tabla de datos bancarios de cobro (Pago Móvil, transferencia, depósito, depósito USD) para la app. Nova tampoco inyecta cuenta/teléfono/RIF desde `crm_settings`.
- **Mock en la app:** `src/features/customer/payment-instructions-gateway.ts`. Los montos se copian de `account-quote` (strings VE). Banco/RIF/teléfono son datos mock de destino.
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

- **Estado en CRM:** no hay columna `cedula` en `clients`. Cédula en `envoicing` / Wispro. **IP no está** en `ClientEnvoicingData` ni en `wispro-api` de facturación.
- **Mock:** titular e IP = `null` (no se muestran inventados; IP se omite). Cédula = la que el usuario escribió al entrar, no un dato de Wispro.
- **Propuesta mínima:** `GET /api/app/account-quote` / contrato debe devolver `holder_name`, `cedula` y `ip_address` **solo si el backend la expone**.

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

# Huecos de backend para la app móvil

Fuente inspeccionada: CRM sibling `C:\Users\Oficce\Documents\innovercorp` (`innover-crm`).
La app de cliente llama `/api/app/*` (sesión, messages, devices). **Esas rutas no están en el CRM sibling.** No se fingen 200: el `ApiClient` pega al `EXPO_PUBLIC_API_BASE_URL` y muestra el error real.

## esto no existe en el CRM; hay que crearlo

### 0. Canal Innover Flow (`/api/app/session`, `/messages`, `/devices`)

- **Estado en CRM sibling:** no hay `app/api/app/*`. El inbox sigue en `/api/crm/*` y el canal legado en `/api/whatsapp/*`.
- **App:** `src/lib/api-client.ts` implementa el contrato (JWT Bearer, `x-app-secret` solo en session, multipart media).
- **Propuesta mínima:** las 4 rutas del contrato + tabla `app_devices` + disparo de IA si `human_mode=false`.

### 1. Login de abonado (cédula + clave autogenerada desde el backend)

- **Estado en CRM:** **esto no existe en el CRM; hay que crearlo**. No hay autenticación de clientes con cédula ni generación automática de contraseñas. `clients` no tiene columna `cedula` (vive en Wispro / `envoicing` / `crm_payments.cedula`) ni hash de credenciales. La tabla `agents` del CRM es para asesores humanos internos (email + password en claro), no para clientes ni perfiles de app.
- **Mock en la app:** `src/features/auth/session-gateway.ts` y `src/features/auth/auth-gateway.ts`.
- **Propuesta mínima:**
  1. `POST /api/app/auth/generate-key`: recibe `{ organization_slug, cedula }`, valida contra el abonado en Wispro/`clients`, genera automáticamente la clave segura (PIN/alfanumérico) y la notifica por SMS/WhatsApp al teléfono del contrato.
  2. `POST /api/app/auth/login` (o `/api/app/session` con `{ cedula, password }`): verifica la clave contra `app_client_credentials` y devuelve el JWT Bearer con el rol `customer`, datos del abonado y conversación abierta.

### 2. Resolución de perfil desde el JWT

- **Estado en CRM:** no existen `profiles` / `app_users`. Técnicos y supervisores se resuelven por last10 de WhatsApp.
- **Mock:** el gateway de auth devuelve `AppRole` (`customer` | `technician` | `supervisor`).
- **Propuesta mínima:** `app_profiles` (un rol por usuario) + RPC `app_my_profile()`.

### 3. Marca de canal en `conversations`

- **Estado en CRM:** no hay `conversations.channel` ni `messages.metadata.channel`. Hay una conversación activa por `client_id`.
- **Mock:** el chat asume canal `app` en memoria.
- **Propuesta mínima:** `channel text CHECK ('whatsapp','app')` + índice único `(client_id, channel)` en hilos abiertos.

### 4. Ingreso `channel=app` hacia Nova (sin Graph / Meta)

- **Estado en CRM:** `replyToConversationWithAi` envía por Graph y exige teléfono. Callers: webhook WhatsApp, process-receipt, `/api/crm/ai/reply` (secreto interno).
- **Mock / aislamiento:** un solo módulo `src/lib/channel-app-ingress.ts` con `TODO(channel=app)`.
- **Propuesta mínima:** adapter de salida `app` (INSERT `type='out'` + Realtime) y `POST /api/app/messages` JWT que respete `human_mode` / horario.

### 5. Cotización de saldo ya formateada

- **Estado en CRM:** `accountStatus` / `serviceSuspended` y `enrichDebtWithBcv` existen en servidor, pero no hay endpoint para la app.
- **Mock:** `src/features/customer/account-quote-gateway.ts` (strings VE fijos).
- **Propuesta mínima:** `GET /api/app/account-quote` con solo strings: `account_status`, `debt_usd_formatted`, `debt_bs_formatted`, `bcv_rate_display`, `office_closed`, `next_open_label`.

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

### 9. Ticket del cliente (`crm_wispro_casos.wispro_public_id`)

- **Estado en CRM:** la tabla y `wispro_public_id` existen. RLS sin policies en repo. Login mock no es JWT.
- **Mock:** `fetchCustomerOpenTicket` **no inventa número**. Si el `userId` empieza por `mock-`, devuelve `null` (estado vacío). Con JWT real consulta `crm_wispro_casos` (`open`/`scheduled`, `crm_client_id`, `wispro_public_id IS NOT NULL`).
- **esto no existe en el CRM; hay que crearlo:** endpoint o RLS para que el abonado lea solo su caso.

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

## Discrepancias ya aplicadas en tipos de la app

- Cierre de caso: columna real `resolution_observation` (no `observation`).
- Status SQL de caso: `open` | `scheduled` | `done` | `cancelled`.
- `clients.account`: `Al día` | `Con deuda` | `Suspendido` | `Prospecto`.

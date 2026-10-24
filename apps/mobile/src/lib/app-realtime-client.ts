import type { AppRealtimeSession } from "@/types/app-channel";
import {
  createClient,
  type RealtimeChannel,
  type SupabaseClient,
} from "@supabase/supabase-js";

export const createAppRealtimeClient = (
  realtime: AppRealtimeSession,
): SupabaseClient => {
  const client = createClient(realtime.url, realtime.anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
  client.realtime.setAuth(realtime.accessToken);
  return client;
};

export type AppRealtimeTicketScope =
  | { kind: "client"; clientId: number }
  | { kind: "technician"; technicianId: string }
  | { kind: "organization"; organizationId: string }
  | { kind: "none" };

export const subscribeAppRealtime = (input: {
  supabase: SupabaseClient;
  conversationId: number;
  channelKey: string;
  ticketScope?: AppRealtimeTicketScope;
  onMessage: (row: Record<string, unknown>, event: "INSERT" | "UPDATE") => void;
  onConversation?: (row: Record<string, unknown>) => void;
  onTicket?: (
    row: Record<string, unknown>,
    event: "INSERT" | "UPDATE" | "DELETE",
  ) => void;
  onStatus?: (status: string) => void;
}): (() => void) => {
  let channel: RealtimeChannel = input.supabase.channel(
    `app:${input.conversationId}:${input.channelKey}`,
  );

  channel = channel
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `conversation_id=eq.${input.conversationId}`,
      },
      (payload) =>
        input.onMessage(payload.new as Record<string, unknown>, "INSERT"),
    )
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "messages",
        filter: `conversation_id=eq.${input.conversationId}`,
      },
      (payload) =>
        input.onMessage(payload.new as Record<string, unknown>, "UPDATE"),
    )
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "conversations",
        filter: `id=eq.${input.conversationId}`,
      },
      (payload) =>
        input.onConversation?.(payload.new as Record<string, unknown>),
    );

  const scope = input.ticketScope ?? { kind: "none" };
  if (scope.kind === "client") {
    channel = channel.on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "field_tickets",
        filter: `crm_client_id=eq.${scope.clientId}`,
      },
      (payload) => {
        const event = payload.eventType as "INSERT" | "UPDATE" | "DELETE";
        const row = (
          event === "DELETE" ? payload.old : payload.new
        ) as Record<string, unknown>;
        input.onTicket?.(row, event);
      },
    );
  } else if (scope.kind === "technician") {
    channel = channel.on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "field_tickets",
        filter: `employee_id=eq.${scope.technicianId}`,
      },
      (payload) => {
        const event = payload.eventType as "INSERT" | "UPDATE" | "DELETE";
        const row = (
          event === "DELETE" ? payload.old : payload.new
        ) as Record<string, unknown>;
        input.onTicket?.(row, event);
      },
    );
  } else if (scope.kind === "organization") {
    channel = channel.on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "field_tickets",
        filter: `organization_id=eq.${scope.organizationId}`,
      },
      (payload) => {
        const event = payload.eventType as "INSERT" | "UPDATE" | "DELETE";
        const row = (
          event === "DELETE" ? payload.old : payload.new
        ) as Record<string, unknown>;
        input.onTicket?.(row, event);
      },
    );
  }

  channel.subscribe((status) => input.onStatus?.(status));

  return () => {
    void input.supabase.removeChannel(channel);
  };
};

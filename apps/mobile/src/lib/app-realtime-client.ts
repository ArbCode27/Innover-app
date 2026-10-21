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

export const subscribeAppRealtime = (input: {
  supabase: SupabaseClient;
  conversationId: number;
  clientId: number;
  onMessage: (row: Record<string, unknown>, event: "INSERT" | "UPDATE") => void;
  onConversation?: (row: Record<string, unknown>) => void;
  onTicket?: (
    row: Record<string, unknown>,
    event: "INSERT" | "UPDATE" | "DELETE",
  ) => void;
  onStatus?: (status: string) => void;
}): (() => void) => {
  const channel: RealtimeChannel = input.supabase
    .channel(`app:${input.conversationId}:${input.clientId}`)
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
    )
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "field_tickets",
        filter: `crm_client_id=eq.${input.clientId}`,
      },
      (payload) => {
        const event = payload.eventType as "INSERT" | "UPDATE" | "DELETE";
        const row = (
          event === "DELETE" ? payload.old : payload.new
        ) as Record<string, unknown>;
        input.onTicket?.(row, event);
      },
    )
    .subscribe((status) => input.onStatus?.(status));

  return () => {
    void input.supabase.removeChannel(channel);
  };
};

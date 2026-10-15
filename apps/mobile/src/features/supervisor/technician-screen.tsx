import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { ScreenState } from "@/components/screen-state";
import { useAuthSession } from "@/features/auth/auth-session";
import { TicketFilterGroup } from "@/features/supervisor/ticket-filter-group";
import { TeamTicketList } from "@/features/supervisor/team-ticket-list";
import {
  fetchSupervisorOwnQueue,
  fetchTechnicianTicketsForSupervisor,
  searchTechnicianAsTyped,
} from "@/features/supervisor/supervisor-gateway";
import type { TechnicianNameLookup } from "@/features/supervisor/technician-name-lookup";
import { useTechnicianCasosRealtime } from "@/features/technician/use-casos-realtime";
import { useQuery } from "@tanstack/react-query";
import { Info } from "lucide-react-native";
import * as React from "react";
import { ScrollView, View } from "react-native";
import type { TeamTicketFilter, TechnicianDirectoryEntry } from "@/types/domain";

type QueueTarget =
  | { kind: "none" }
  | { kind: "personal" }
  | { kind: "technician"; technician: TechnicianDirectoryEntry };

export const SupervisorTechnicianScreen = () => {
  const { profile } = useAuthSession();
  const [draft, setDraft] = React.useState("");
  const [submittedQuery, setSubmittedQuery] = React.useState("");
  const [filter, setFilter] = React.useState<TeamTicketFilter>("pending");
  const [target, setTarget] = React.useState<QueueTarget>({ kind: "none" });
  const [lookup, setLookup] = React.useState<TechnicianNameLookup | null>(null);
  const [lookupError, setLookupError] = React.useState<string | null>(null);

  useTechnicianCasosRealtime(profile?.supervisorId ?? "supervisor-technician");

  const queueQuery = useQuery({
    queryKey: [
      "supervisor-technician-queue",
      profile?.userId,
      target,
      filter,
    ],
    queryFn: () => {
      if (target.kind === "personal") {
        return fetchSupervisorOwnQueue(profile, filter);
      }
      if (target.kind === "technician") {
        return fetchTechnicianTicketsForSupervisor(
          profile,
          target.technician.id,
          filter,
        );
      }
      return Promise.resolve([]);
    },
    enabled: profile?.role === "supervisor" && target.kind !== "none",
  });

  const handleSearch = async () => {
    setLookupError(null);
    try {
      const result = await searchTechnicianAsTyped(profile, draft);
      setLookup(result);
      setSubmittedQuery(draft.trim());
      if (result.status === "personal") {
        setTarget({ kind: "personal" });
        return;
      }
      if (result.status === "resolved") {
        setTarget({ kind: "technician", technician: result.technician });
        return;
      }
      setTarget({ kind: "none" });
    } catch (error) {
      setLookupError(
        error instanceof Error
          ? error.message
          : "No se pudo buscar al técnico.",
      );
      setTarget({ kind: "none" });
    }
  };

  const handlePersonalQueue = () => {
    setDraft("mis tickets");
    setSubmittedQuery("mis tickets");
    setLookup({ status: "personal" });
    setTarget({ kind: "personal" });
    setLookupError(null);
  };

  const handleConfirm = (technician: TechnicianDirectoryEntry) => {
    setTarget({ kind: "technician", technician });
    setLookup({ status: "resolved", technician });
  };

  const heading =
    target.kind === "personal"
      ? "Tu cola"
      : target.kind === "technician"
        ? `Tickets de ${target.technician.name}`
        : null;

  return (
    <View className="flex-1 bg-background">
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerClassName="gap-3 p-4"
      >
        <Input
          accessibilityLabel="Buscar técnico por nombre"
          placeholder="Nombre tal cual lo escribes"
          value={draft}
          onChangeText={setDraft}
          autoCorrect={false}
          autoCapitalize="words"
        />
        <View className="flex-row gap-2">
          <Button
            className="flex-1"
            onPress={() => {
              void handleSearch();
            }}
            accessibilityLabel="Buscar técnico"
          >
            <Text>Buscar</Text>
          </Button>
          <Button
            variant="outline"
            className="flex-1"
            onPress={handlePersonalQueue}
            accessibilityLabel="Mis tickets"
          >
            <Text>Mis tickets</Text>
          </Button>
        </View>
        <Button
          variant="ghost"
          onPress={handlePersonalQueue}
          accessibilityLabel="Mi ruta"
        >
          <Text>Mi ruta</Text>
        </Button>

        <TicketFilterGroup value={filter} onChange={setFilter} />

        {lookupError ? (
          <Text className="text-destructive">{lookupError}</Text>
        ) : null}

        {lookup?.status === "empty" ? (
          <Alert icon={Info}>
            <AlertTitle>Escribe un nombre</AlertTitle>
            <AlertDescription>
              Lo buscamos tal cual. Si hay varios, te pedimos cuál.
            </AlertDescription>
          </Alert>
        ) : null}

        {lookup?.status === "not_found" ? (
          <Alert icon={Info}>
            <AlertTitle>No encontramos ese nombre</AlertTitle>
            <AlertDescription>
              No hay un técnico que coincida con «{submittedQuery}». No
              cambiamos el nombre.
            </AlertDescription>
          </Alert>
        ) : null}

        {lookup?.status === "ambiguous" ? (
          <View className="gap-2">
            <Alert icon={Info}>
              <AlertTitle>¿A cuál te refieres?</AlertTitle>
              <AlertDescription>
                Hay varios con «{lookup.query}». Elige uno. No autocorregimos.
              </AlertDescription>
            </Alert>
            {lookup.candidates.map((candidate) => (
              <Button
                key={candidate.id}
                variant="outline"
                onPress={() => handleConfirm(candidate)}
                accessibilityLabel={`Elegir ${candidate.name}`}
              >
                <Text>{candidate.name}</Text>
              </Button>
            ))}
          </View>
        ) : null}

        {target.kind !== "none" ? (
          <View className="gap-3">
            {heading ? <Text variant="h4">{heading}</Text> : null}
            {target.kind === "personal" ? (
              <Text variant="muted">
                Esta es tu cola, no la del equipo.
              </Text>
            ) : null}
            <ScreenState
              isLoading={queueQuery.isPending}
              isEmpty={
                !queueQuery.isPending &&
                !queueQuery.isError &&
                (queueQuery.data?.length ?? 0) === 0
              }
              emptyTitle="Sin tickets en este filtro"
              emptyDescription="Cambia el filtro o consulta otro técnico."
              errorMessage={
                queueQuery.isError ? "No se pudo cargar esa cola." : null
              }
              onRetry={() => {
                void queueQuery.refetch();
              }}
            >
              <TeamTicketList tickets={queueQuery.data ?? []} />
            </ScreenState>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
};

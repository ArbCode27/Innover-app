import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Icon } from "@/components/ui/icon";
import { Separator } from "@/components/ui/separator";
import { Text } from "@/components/ui/text";
import type { TeamTechnicianOption } from "@/features/supervisor/ticket-scope";
import { cn } from "@/lib/utils";
import { Check, UserRound } from "lucide-react-native";
import * as React from "react";
import { Pressable, ScrollView, View } from "react-native";

type TechnicianFilterSelectProps = {
  options: TeamTechnicianOption[];
  value: string | null;
  onChange: (next: string | null) => void;
};

export const TechnicianFilterSelect = ({
  options,
  value,
  onChange,
}: TechnicianFilterSelectProps) => {
  const [open, setOpen] = React.useState(false);

  const selected = options.find((option) => option.key === value) ?? null;
  const triggerLabel = selected
    ? `${selected.label} · ${selected.count}`
    : "Todos los técnicos";

  const handleSelect = (next: string | null) => {
    onChange(next);
    setOpen(false);
  };

  return (
    <View className="gap-2">
      <Text className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Técnico
      </Text>

      <Drawer open={open} onOpenChange={setOpen}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Técnico: ${triggerLabel}. Abrir selector`}
          accessibilityState={{ expanded: open }}
          onPress={() => setOpen(true)}
          className="min-h-12 flex-row items-center gap-3 rounded-xl border border-border bg-card px-3.5 active:opacity-90"
        >
          <View className="size-9 items-center justify-center rounded-full bg-secondary">
            <Icon as={UserRound} size={18} className="text-secondary-foreground" />
          </View>
          <View className="min-w-0 flex-1">
            <Text
              className="text-sm font-semibold text-foreground"
              numberOfLines={1}
            >
              {triggerLabel}
            </Text>
            <Text className="text-xs text-muted-foreground" numberOfLines={1}>
              {selected
                ? "Filtrando por este técnico"
                : "Toca para elegir un técnico"}
            </Text>
          </View>
        </Pressable>

        <DrawerContent className="bg-card">
          <DrawerHeader>
            <DrawerTitle>Elegir técnico</DrawerTitle>
            <DrawerDescription>
              Filtra la lista del equipo por un técnico, o deja todos.
            </DrawerDescription>
          </DrawerHeader>

          <ScrollView
            className="max-h-80"
            contentContainerClassName="px-6 pb-2"
            keyboardShouldPersistTaps="handled"
          >
            <OptionRow
              label="Todos los técnicos"
              detail={`${options.reduce((sum, item) => sum + item.count, 0)} en este filtro`}
              selected={value == null}
              onPress={() => handleSelect(null)}
            />
            {options.map((option) => (
              <View key={option.key}>
                <Separator className="bg-border/70" />
                <OptionRow
                  label={option.label}
                  detail={
                    option.count === 1
                      ? "1 ticket"
                      : `${option.count} tickets`
                  }
                  selected={value === option.key}
                  onPress={() => handleSelect(option.key)}
                />
              </View>
            ))}
          </ScrollView>
        </DrawerContent>
      </Drawer>
    </View>
  );
};

const OptionRow = ({
  label,
  detail,
  selected,
  onPress,
}: {
  label: string;
  detail: string;
  selected: boolean;
  onPress: () => void;
}) => (
  <Pressable
    onPress={onPress}
    accessibilityRole="radio"
    accessibilityState={{ selected }}
    accessibilityLabel={`${label}. ${detail}`}
    className="min-h-12 flex-row items-center justify-between gap-3 py-3.5 active:opacity-80"
  >
    <View className="min-w-0 flex-1 gap-0.5 pr-2">
      <Text
        className={cn(
          "text-sm font-medium",
          selected ? "text-primary" : "text-foreground",
        )}
        numberOfLines={1}
      >
        {label}
      </Text>
      <Text className="text-xs text-muted-foreground" numberOfLines={1}>
        {detail}
      </Text>
    </View>
    {selected ? (
      <Icon as={Check} size={18} className="text-primary" />
    ) : (
      <View className="size-[18px]" />
    )}
  </Pressable>
);

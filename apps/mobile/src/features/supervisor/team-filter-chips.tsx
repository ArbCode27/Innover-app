import { Text } from "@/components/ui/text";
import { cn } from "@/lib/utils";
import { Pressable, ScrollView, View } from "react-native";

export type TeamFilterChip = {
  key: string;
  label: string;
  count?: number;
};

type TeamFilterChipsProps = {
  label: string;
  options: TeamFilterChip[];
  value: string | null;
  onChange: (next: string | null) => void;
  /** Si true, el chip "Todos" usa value=null. */
  allowAll?: boolean;
  allLabel?: string;
  accessibilityLabel: string;
};

export const TeamFilterChips = ({
  label,
  options,
  value,
  onChange,
  allowAll = true,
  allLabel = "Todos",
  accessibilityLabel,
}: TeamFilterChipsProps) => {
  return (
    <View className="gap-2" accessibilityLabel={accessibilityLabel}>
      <Text className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="flex-row items-center gap-2 pr-1"
      >
        {allowAll ? (
          <Chip
            label={allLabel}
            selected={value == null}
            onPress={() => onChange(null)}
            accessibilityLabel={`${allLabel}, sin filtro`}
          />
        ) : null}
        {options.map((option) => (
          <Chip
            key={option.key}
            label={
              option.count != null
                ? `${option.label} · ${option.count}`
                : option.label
            }
            selected={value === option.key}
            onPress={() => onChange(option.key)}
            accessibilityLabel={`Filtrar por ${option.label}`}
          />
        ))}
      </ScrollView>
    </View>
  );
};

const Chip = ({
  label,
  selected,
  onPress,
  accessibilityLabel,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  accessibilityLabel: string;
}) => (
  <Pressable
    onPress={onPress}
    accessibilityRole="button"
    accessibilityState={{ selected }}
    accessibilityLabel={accessibilityLabel}
    className={cn(
      "min-h-10 items-center justify-center rounded-full border px-3.5",
      selected
        ? "border-primary bg-primary/10"
        : "border-border bg-card",
    )}
  >
    <Text
      className={cn(
        "text-sm font-medium",
        selected ? "text-primary" : "text-muted-foreground",
      )}
    >
      {label}
    </Text>
  </Pressable>
);

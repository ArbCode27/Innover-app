import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { cn } from "@/lib/utils";
import { copyTextToClipboard } from "@/lib/copy-to-clipboard";
import { ArrowRight, Check, ChevronRight, Copy } from "lucide-react-native";
import * as React from "react";
import { Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type PaymentStepHeaderProps = {
  step: number;
  total?: number;
  title: string;
  description?: string;
};

export const PaymentStepHeader = ({
  step,
  total = 4,
  title,
  description,
}: PaymentStepHeaderProps) => {
  const segments = Array.from({ length: total }, (_, index) => index + 1);

  return (
    <View className="gap-3">
      <View className="flex-row gap-1.5">
        {segments.map((segment) => (
          <View
            key={segment}
            className={cn(
              "h-1 flex-1 rounded-full",
              segment <= step ? "bg-primary" : "bg-muted",
            )}
          />
        ))}
      </View>
      <View className="gap-1">
        <Text className="text-[11px] font-extrabold uppercase tracking-wider text-primary">
          Paso {step} de {total}
        </Text>
        <Text className="text-xl font-bold tracking-tight text-foreground">
          {title}
        </Text>
        {description ? (
          <Text className="text-sm leading-relaxed text-muted-foreground">
            {description}
          </Text>
        ) : null}
      </View>
    </View>
  );
};

type PaymentBottomBarProps = {
  label: string;
  accessibilityLabel: string;
  onPress: () => void;
  disabled?: boolean;
};

export const PaymentBottomBar = ({
  label,
  accessibilityLabel,
  onPress,
  disabled = false,
}: PaymentBottomBarProps) => {
  const insets = useSafeAreaInsets();

  return (
    <View
      className="border-t border-border/70 bg-background px-4 pt-3"
      style={{ paddingBottom: Math.max(insets.bottom, 16) }}
    >
      <Button
        disabled={disabled}
        onPress={onPress}
        accessibilityLabel={accessibilityLabel}
        className="h-12 min-h-12 w-full flex-row items-center justify-center gap-2 rounded-xl bg-primary shadow-lg shadow-primary/30 active:opacity-90"
      >
        <Text className="text-xs font-bold uppercase tracking-wider text-primary-foreground">
          {label}
        </Text>
        <Icon as={ArrowRight} size={16} className="text-primary-foreground" />
      </Button>
    </View>
  );
};

type PaymentMethodRowProps = {
  title: string;
  description?: string | null;
  icon: React.ReactNode;
  onPress: () => void;
  accessibilityLabel: string;
};

export const PaymentMethodRow = ({
  title,
  description,
  icon,
  onPress,
  accessibilityLabel,
}: PaymentMethodRowProps) => {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      className="min-h-16 w-full flex-row items-center gap-3.5 rounded-2xl border border-border/80 bg-card px-4 py-3.5 shadow-sm shadow-black/5 active:bg-muted/40"
    >
      <View className="size-11 items-center justify-center rounded-full bg-primary/10">
        {icon}
      </View>
      <View className="flex-1 gap-0.5">
        <Text className="text-base font-semibold text-foreground">{title}</Text>
        {description ? (
          <Text className="text-xs text-muted-foreground">{description}</Text>
        ) : null}
      </View>
      <Icon as={ChevronRight} size={18} className="text-muted-foreground" />
    </Pressable>
  );
};

type CopyValueRowProps = {
  label: string;
  value: string;
};

export const CopyValueRow = ({ label, value }: CopyValueRowProps) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    await copyTextToClipboard(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  return (
    <View className="flex-row items-center justify-between gap-3 py-3">
      <View className="flex-1 gap-0.5">
        <Text className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          {label}
        </Text>
        <Text className="text-base font-semibold text-foreground">{value}</Text>
      </View>
      <Pressable
        onPress={() => {
          void handleCopy();
        }}
        accessibilityRole="button"
        accessibilityLabel={`Copiar ${label}`}
        hitSlop={6}
        className="h-11 min-h-11 flex-row items-center gap-1.5 rounded-xl border border-border/80 bg-muted/40 px-3"
      >
        <Icon
          as={copied ? Check : Copy}
          size={14}
          className="text-primary"
        />
        <Text className="text-xs font-bold text-primary">
          {copied ? "Copiado" : "Copiar"}
        </Text>
      </Pressable>
    </View>
  );
};

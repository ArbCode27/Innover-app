import type { CustomerStackParamList } from "@/app/navigation-types";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { ScreenState } from "@/components/screen-state";
import { fetchFaqItems } from "@/features/customer/faq-gateway";
import type { FaqItem } from "@/types/domain";
import { useRoute, type RouteProp } from "@react-navigation/native";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, HelpCircle } from "lucide-react-native";
import * as React from "react";
import { Pressable, ScrollView, View } from "react-native";

const FaqAccordionItem = ({
  item,
  isOpen,
  onToggle,
}: {
  item: FaqItem;
  isOpen: boolean;
  onToggle: () => void;
}) => {
  return (
    <View className="overflow-hidden rounded-2xl border border-border/80 bg-card">
      <Pressable
        onPress={onToggle}
        accessibilityRole="button"
        accessibilityState={{ expanded: isOpen }}
        accessibilityLabel={item.question}
        className="min-h-14 flex-row items-center gap-3 px-4 py-3.5 active:bg-muted/40"
      >
        <View className="size-9 items-center justify-center rounded-full bg-primary/10">
          <Icon as={HelpCircle} size={16} className="text-primary" />
        </View>
        <Text className="flex-1 text-sm font-semibold text-foreground">
          {item.question}
        </Text>
        <Icon
          as={ChevronDown}
          size={18}
          className={`text-muted-foreground ${isOpen ? "rotate-180" : ""}`}
        />
      </Pressable>
      {isOpen ? (
        <View className="border-t border-border/60 px-4 pb-4 pt-3">
          <Text className="text-sm leading-relaxed text-muted-foreground">
            {item.answer}
          </Text>
        </View>
      ) : null}
    </View>
  );
};

export const CustomerFaqScreen = () => {
  const route = useRoute<RouteProp<CustomerStackParamList, "Ayuda">>();
  const requestedId = route.params?.faqId ?? null;

  const faqQuery = useQuery({
    queryKey: ["customer-faq"],
    queryFn: fetchFaqItems,
  });

  const [openId, setOpenId] = React.useState<string | null>(requestedId);
  const [seenFaqId, setSeenFaqId] = React.useState<string | null>(requestedId);

  if (requestedId !== seenFaqId) {
    setSeenFaqId(requestedId);
    setOpenId(requestedId);
  }

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="p-4 gap-4 pb-10"
    >
      <Card className="border-border/80 bg-card/95">
        <CardHeader className="gap-1.5">
          <CardTitle className="text-lg font-black">
            Preguntas frecuentes
          </CardTitle>
          <CardDescription className="text-xs">
            Respuestas de Conexiones Innover sobre pagos, tickets y tu servicio
            de fibra.
          </CardDescription>
        </CardHeader>
      </Card>

      <ScreenState
        isLoading={faqQuery.isPending}
        errorMessage={
          faqQuery.isError ? "No se pudieron cargar las preguntas." : null
        }
        onRetry={() => {
          void faqQuery.refetch();
        }}
      >
        <View className="gap-2.5">
          {faqQuery.data?.map((item) => (
            <FaqAccordionItem
              key={item.id}
              item={item}
              isOpen={openId === item.id}
              onToggle={() =>
                setOpenId((current) => (current === item.id ? null : item.id))
              }
            />
          ))}
        </View>
      </ScreenState>
    </ScrollView>
  );
};

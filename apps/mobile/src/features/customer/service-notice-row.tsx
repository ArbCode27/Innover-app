import { InnoverIcon } from "@/components/brand-logo";
import { Text } from "@/components/ui/text";
import { formatNoticeTime } from "@/features/customer/service-notice-gateway";
import { chromeForSeverity } from "@/features/customer/service-notice-appearance";
import { cn } from "@/lib/utils";
import type { ServiceNotice } from "@/types/domain";
import { View } from "react-native";

type ServiceNoticeRowProps = {
  notice: ServiceNotice;
};

export const ServiceNoticeRow = ({ notice }: ServiceNoticeRowProps) => {
  const chrome = chromeForSeverity(notice.severity);

  return (
    <View
      className={cn(
        "flex-row items-start gap-3 rounded-xl border p-3",
        chrome.card,
      )}
    >
      <View
        className={cn(
          "mt-0.5 size-8 items-center justify-center rounded-full",
          chrome.iconWrap,
        )}
        accessibilityLabel={`Aviso Innover · ${chrome.label}`}
      >
        <InnoverIcon size={18} tone={chrome.tone} />
      </View>
      <View className="flex-1 gap-0.5">
        <Text className={cn("text-[10px] font-extrabold uppercase", chrome.title)}>
          {chrome.label}
        </Text>
        <Text className={cn("text-xs font-bold", chrome.title)}>
          {notice.title}
        </Text>
        <Text className="text-[11px] leading-relaxed text-muted-foreground">
          {notice.body}
        </Text>
        <Text className="mt-1 text-[9px] font-semibold text-muted-foreground/80">
          {formatNoticeTime(notice.createdAt)} · Conexiones Innover
        </Text>
      </View>
    </View>
  );
};

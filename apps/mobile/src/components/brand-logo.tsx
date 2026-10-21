import { Text } from "@/components/ui/text";
import * as React from "react";
import { View } from "react-native";
import Svg, { Path } from "react-native-svg";

export type InnoverIconTone =
  | "brand"
  | "critical"
  | "warning"
  | "info"
  | "success";

const TONE_FILL: Record<InnoverIconTone, string> = {
  brand: "hsl(350 86% 56%)",
  critical: "hsl(350 86% 56%)",
  warning: "hsl(38 92% 50%)",
  info: "hsl(226 96% 60%)",
  success: "hsl(160 84% 39%)",
};

/**
 * Ícono de marca Star Conectados (estrella con acento de fibra).
 * Los rellenos del SVG no usan clases Tailwind.
 */
export const InnoverIcon = ({
  size = 30,
  tone = "brand",
}: {
  size?: number;
  tone?: InnoverIconTone;
}) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2L14.8 8.6L22 9.3L16.7 14.1L18.2 21.2L12 17.5L5.8 21.2L7.3 14.1L2 9.3L9.2 8.6L12 2Z"
        fill={TONE_FILL[tone]}
      />
      <Path
        d="M13.5 5.2C15.6 5.4 18.2 6.6 19.6 8.5C17.8 8.8 15.5 7.8 13.5 6.8Z"
        fill="hsl(226 96% 60%)"
      />
    </Svg>
  );
};

export const InnoverLogo = ({
  subtitle = "COBERTURA NACIONAL",
}: {
  subtitle?: string;
}) => {
  return (
    <View className="flex-row items-center gap-2.5">
      <InnoverIcon size={30} />
      <View className="justify-center">
        <Text className="text-[13px] font-black tracking-tight text-foreground">
          STAR CONECTADOS
        </Text>
        <Text className="text-[8.5px] font-extrabold uppercase tracking-widest text-muted-foreground">
          {subtitle}
        </Text>
      </View>
    </View>
  );
};

export const InnoverSparkIcon = InnoverIcon;
export const BrandHeaderTitle = InnoverLogo;
export const StarConectadosIcon = InnoverIcon;
export const StarConectadosLogo = InnoverLogo;

import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { cn } from "@/lib/utils";
import {
  setAudioModeAsync,
  useAudioPlayer,
  useAudioPlayerStatus,
} from "expo-audio";
import { Pause, Play } from "lucide-react-native";
import * as React from "react";
import { Pressable, View } from "react-native";

type AudioMessagePlayerProps = {
  uri: string;
  mine?: boolean;
};

const WAVE_BARS = [5, 11, 7, 16, 9, 14, 6, 18, 8, 13, 10, 17, 7, 12, 15, 6, 14, 9, 16, 8];

const formatDuration = (seconds: number) => {
  if (!Number.isFinite(seconds) || seconds < 0) {
    return "0:00";
  }
  const total = Math.floor(seconds);
  const minutes = Math.floor(total / 60);
  const rest = total % 60;
  return `${minutes}:${rest.toString().padStart(2, "0")}`;
};

export const AudioMessagePlayer = ({
  uri,
  mine = false,
}: AudioMessagePlayerProps) => {
  const player = useAudioPlayer({ uri });
  const status = useAudioPlayerStatus(player);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const duration = status.duration > 0 ? status.duration : 0;
  const progress =
    duration > 0 ? Math.min(1, status.currentTime / duration) : 0;
  const filledBars = Math.max(1, Math.round(progress * WAVE_BARS.length));

  const handleToggle = async () => {
    setErrorMessage(null);
    try {
      await setAudioModeAsync({
        allowsRecording: false,
        playsInSilentMode: true,
      });
      if (status.playing) {
        player.pause();
        return;
      }
      if (status.didJustFinish || status.currentTime >= status.duration) {
        await player.seekTo(0);
      }
      player.play();
    } catch {
      setErrorMessage("No se pudo reproducir el audio.");
    }
  };

  return (
    <View className="min-w-[200px] gap-1.5">
      <View className="flex-row items-center gap-2">
        <Pressable
          onPress={() => {
            void handleToggle();
          }}
          accessibilityRole="button"
          accessibilityLabel={
            status.playing ? "Pausar audio" : "Reproducir audio"
          }
          className={cn(
            "size-11 items-center justify-center rounded-full",
            mine ? "bg-primary" : "bg-primary/15",
          )}
        >
          <Icon
            as={status.playing ? Pause : Play}
            size={18}
            className={mine ? "text-primary-foreground" : "text-primary"}
          />
        </Pressable>
        <View className="h-8 flex-1 flex-row items-center gap-0.5">
          {WAVE_BARS.map((height, index) => (
            <View
              key={`${height}-${index}`}
              className={cn(
                "w-0.5 rounded-full",
                index < filledBars
                  ? mine
                    ? "bg-primary"
                    : "bg-primary/70"
                  : mine
                    ? "bg-primary/25"
                    : "bg-muted-foreground/30",
              )}
              style={{ height }}
            />
          ))}
        </View>
        <Text
          className={cn(
            "text-[11px] tabular-nums",
            mine ? "text-secondary-foreground" : "text-muted-foreground",
          )}
        >
          {formatDuration(status.playing ? status.currentTime : duration)}
        </Text>
      </View>
      {errorMessage ? (
        <Text className="text-destructive text-xs">{errorMessage}</Text>
      ) : null}
    </View>
  );
};

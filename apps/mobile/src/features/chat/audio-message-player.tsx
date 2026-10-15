import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import {
  setAudioModeAsync,
  useAudioPlayer,
  useAudioPlayerStatus,
} from "expo-audio";
import { Pause, Play } from "lucide-react-native";
import { Icon } from "@/components/ui/icon";
import * as React from "react";
import { View } from "react-native";

type AudioMessagePlayerProps = {
  uri: string;
  inverted?: boolean;
};

export const AudioMessagePlayer = ({
  uri,
  inverted = false,
}: AudioMessagePlayerProps) => {
  const player = useAudioPlayer({ uri });
  const status = useAudioPlayerStatus(player);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

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
    <View className="gap-2">
      <Button
        variant={inverted ? "secondary" : "outline"}
        onPress={() => {
          void handleToggle();
        }}
        accessibilityLabel={status.playing ? "Pausar audio" : "Reproducir audio"}
      >
        <Icon as={status.playing ? Pause : Play} className="size-4" />
        <Text>{status.playing ? "Pausar" : "Reproducir"}</Text>
      </Button>
      {errorMessage ? (
        <Text className="text-destructive">{errorMessage}</Text>
      ) : null}
    </View>
  );
};

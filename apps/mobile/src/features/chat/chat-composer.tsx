import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { cn } from "@/lib/utils";
import {
  Camera,
  FileText,
  Film,
  Image as ImageIcon,
  MapPin,
  Mic,
  Paperclip,
  Send,
  Square,
} from "lucide-react-native";
import * as React from "react";
import {
  Keyboard,
  Platform,
  Pressable,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type ChatComposerProps = {
  draft: string;
  onDraftChange: (value: string) => void;
  isSending: boolean;
  isRecording: boolean;
  recordingSeconds: number;
  onSendText: () => void;
  onPickImage: () => void;
  onTakePhoto: () => void;
  onPickVideo: () => void;
  onPickDocument: () => void;
  onShareLocation: () => void;
  onToggleVoice: () => void;
};

const formatElapsed = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${minutes}:${rest.toString().padStart(2, "0")}`;
};

export const ChatComposer = ({
  draft,
  onDraftChange,
  isSending,
  isRecording,
  recordingSeconds,
  onSendText,
  onPickImage,
  onTakePhoto,
  onPickVideo,
  onPickDocument,
  onShareLocation,
  onToggleVoice,
}: ChatComposerProps) => {
  const insets = useSafeAreaInsets();
  const [attachOpen, setAttachOpen] = React.useState(false);
  const [keyboardVisible, setKeyboardVisible] = React.useState(false);
  const hasText = draft.trim().length > 0;

  React.useEffect(() => {
    const showEvent =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const show = Keyboard.addListener(showEvent, () => {
      setKeyboardVisible(true);
      setAttachOpen(false);
    });
    const hide = Keyboard.addListener(hideEvent, () => {
      setKeyboardVisible(false);
    });
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  const bottomPad = keyboardVisible ? 28 : Math.max(insets.bottom, 12);

  const handlePrimary = () => {
    if (hasText) {
      onSendText();
      return;
    }
    onToggleVoice();
  };

  return (
    <View className="bg-background px-3 pt-2" style={{ paddingBottom: bottomPad }}>
      {attachOpen && !isRecording ? (
        <View className="mb-3 rounded-3xl border border-border/80 bg-card px-2 py-4 shadow-sm">
          <View className="flex-row flex-wrap justify-evenly gap-y-3">
            <AttachAction
              icon={ImageIcon}
              label="Galería"
              onPress={() => {
                setAttachOpen(false);
                onPickImage();
              }}
            />
            <AttachAction
              icon={Camera}
              label="Cámara"
              onPress={() => {
                setAttachOpen(false);
                onTakePhoto();
              }}
            />
            <AttachAction
              icon={Film}
              label="Video"
              onPress={() => {
                setAttachOpen(false);
                onPickVideo();
              }}
            />
            <AttachAction
              icon={FileText}
              label="Archivo"
              onPress={() => {
                setAttachOpen(false);
                onPickDocument();
              }}
            />
            <AttachAction
              icon={MapPin}
              label="Ubicación"
              onPress={() => {
                setAttachOpen(false);
                onShareLocation();
              }}
            />
          </View>
        </View>
      ) : null}

      <View className="flex-row items-end gap-2">
        <View className="min-h-12 flex-1 flex-row items-end rounded-full border border-border bg-card px-1.5 py-1">
          {isRecording ? (
            <View className="h-11 flex-1 flex-row items-center gap-2 px-3">
              <View className="size-2.5 rounded-full bg-destructive" />
              <Text className="text-sm font-medium text-foreground">
                Grabando {formatElapsed(recordingSeconds)}
              </Text>
            </View>
          ) : (
            <>
              <Pressable
                onPress={() => {
                  Keyboard.dismiss();
                  setAttachOpen((open) => !open);
                }}
                accessibilityRole="button"
                accessibilityLabel="Adjuntar"
                className="size-11 items-center justify-center"
              >
                <Icon
                  as={Paperclip}
                  size={20}
                  className={cn(
                    attachOpen ? "text-primary" : "text-muted-foreground",
                  )}
                />
              </Pressable>
              <TextInput
                accessibilityLabel="Escribe un mensaje"
                placeholder="Mensaje"
                value={draft}
                onChangeText={onDraftChange}
                multiline
                className="placeholder:text-muted-foreground max-h-24 min-h-11 flex-1 py-2 text-base leading-5 text-foreground"
              />
              <Pressable
                onPress={onTakePhoto}
                accessibilityRole="button"
                accessibilityLabel="Tomar foto"
                className="size-11 items-center justify-center"
              >
                <Icon as={Camera} size={20} className="text-muted-foreground" />
              </Pressable>
            </>
          )}
        </View>

        <Pressable
          onPress={handlePrimary}
          disabled={isSending && hasText}
          accessibilityRole="button"
          accessibilityLabel={
            isRecording
              ? "Detener y enviar audio"
              : hasText
                ? "Enviar"
                : "Grabar audio"
          }
          className={cn(
            "size-12 items-center justify-center rounded-full bg-primary",
            isSending && hasText && "opacity-50",
          )}
        >
          <Icon
            as={isRecording ? Square : hasText ? Send : Mic}
            size={20}
            className="text-primary-foreground"
          />
        </Pressable>
      </View>
    </View>
  );
};

const AttachAction = ({
  icon,
  label,
  onPress,
}: {
  icon: typeof ImageIcon;
  label: string;
  onPress: () => void;
}) => (
  <Pressable
    onPress={onPress}
    accessibilityRole="button"
    accessibilityLabel={label}
    className="w-[72px] items-center gap-2"
  >
    <View className="size-14 items-center justify-center rounded-full bg-primary shadow-sm shadow-primary/25">
      <Icon as={icon} size={24} className="text-primary-foreground" />
    </View>
    <Text className="text-center text-[11px] font-medium text-foreground">
      {label}
    </Text>
  </Pressable>
);

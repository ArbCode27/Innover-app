import {
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from "expo-audio";
import * as React from "react";

export const useVoiceRecorder = () => {
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(recorder);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const handleStart = async () => {
    setErrorMessage(null);
    try {
      const permission = await requestRecordingPermissionsAsync();
      if (!permission.granted) {
        setErrorMessage("Necesitamos el micrófono para grabar audio.");
        return;
      }
      await setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
      });
      await recorder.prepareToRecordAsync();
      recorder.record();
    } catch {
      setErrorMessage("No se pudo empezar la grabación.");
    }
  };

  const handleStop = async () => {
    try {
      await recorder.stop();
      await setAudioModeAsync({
        allowsRecording: false,
        playsInSilentMode: true,
      });
      const uri = recorder.uri;
      if (!uri) {
        setErrorMessage("No se pudo guardar el audio.");
        return null;
      }
      return { uri, mimeType: "audio/m4a" };
    } catch {
      setErrorMessage("No se pudo detener la grabación.");
      return null;
    }
  };

  return {
    isRecording: recorderState.isRecording,
    errorMessage,
    handleStart,
    handleStop,
  };
};

import * as Location from "expo-location";
import type { OutboundClientDraft } from "@/types/domain";

const readCurrentPosition = async (deniedMessage: string) => {
  const permission = await Location.requestForegroundPermissionsAsync();
  if (permission.status !== "granted") {
    throw new Error(deniedMessage);
  }
  return Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  });
};

export const buildChatLocationDraft = async (): Promise<OutboundClientDraft> => {
  const position = await readCurrentPosition(
    "Necesitamos tu ubicación para compartirla.",
  );
  return {
    content: "Ubicación",
    mediaType: "location",
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
    locationName: "Ubicación compartida",
  };
};

export const buildOutageLocationDraft = async (): Promise<OutboundClientDraft> => {
  const position = await readCurrentPosition(
    "Necesitamos tu ubicación para reportar la falla.",
  );
  return {
    content: "Tengo una falla en el servicio.",
    mediaType: "location",
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
    locationName: "Ubicación de la falla",
  };
};

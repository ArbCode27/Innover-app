import * as Location from "expo-location";
import type { OutboundClientDraft } from "@/types/domain";

export const buildOutageLocationDraft = async (): Promise<OutboundClientDraft> => {
  const permission = await Location.requestForegroundPermissionsAsync();
  if (permission.status !== "granted") {
    throw new Error("Necesitamos tu ubicación para reportar la falla.");
  }

  const position = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  });

  return {
    content: "Tengo una falla en el servicio.",
    mediaType: "location",
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
    locationName: "Ubicación de la falla",
  };
};

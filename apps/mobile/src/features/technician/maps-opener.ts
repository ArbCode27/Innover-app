import type { AppCaso } from "@/types/domain";
import { Linking } from "react-native";

export const resolveCasoMapsUrl = (caso: AppCaso): string | null => {
  const mapsUrl = caso.mapsUrl?.trim();
  if (mapsUrl) {
    return mapsUrl;
  }
  if (caso.latitude != null && caso.longitude != null) {
    return `https://maps.google.com/?q=${caso.latitude},${caso.longitude}`;
  }
  return null;
};

export const openCasoInMaps = async (caso: AppCaso) => {
  const url = resolveCasoMapsUrl(caso);
  if (!url) {
    throw new Error("Este caso no tiene ubicación en Maps.");
  }
  await Linking.openURL(url);
};

import type { AppCaso } from "@/types/domain";
import { Linking } from "react-native";

/** Solo URLs que el sistema puede abrir como ubicación (no texto suelto del CRM). */
export const isOpenableMapsUrl = (value: string): boolean => {
  const trimmed = value.trim();
  if (!trimmed) {
    return false;
  }
  try {
    const parsed = new URL(trimmed);
    const protocol = parsed.protocol.toLowerCase();
    return (
      protocol === "http:" || protocol === "https:" || protocol === "geo:"
    );
  } catch {
    return false;
  }
};

export const resolveCasoMapsUrl = (caso: AppCaso): string | null => {
  const mapsUrl = caso.mapsUrl?.trim();
  if (mapsUrl && isOpenableMapsUrl(mapsUrl)) {
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
    throw new Error("Este caso no tiene una ubicación válida en Maps.");
  }
  try {
    await Linking.openURL(url);
  } catch (error) {
    if (__DEV__) {
      console.warn("[maps] openURL", { url, error });
    }
    throw new Error(
      "No se pudo abrir Maps. Revisa que haya una app de mapas en este equipo.",
    );
  }
};

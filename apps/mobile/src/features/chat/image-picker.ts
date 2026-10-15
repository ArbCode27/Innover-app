import * as ImagePicker from "expo-image-picker";

export type PickedChatImage = {
  uri: string;
  mimeType: string;
  fileName: string;
};

const fileNameFromUri = (uri: string, mimeType: string) => {
  const last = uri.split("/").pop();
  if (last && last.includes(".")) {
    return last;
  }
  const ext = mimeType.includes("png") ? "png" : "jpg";
  return `imagen-${Date.now()}.${ext}`;
};

export const pickChatImage = async (): Promise<PickedChatImage | null> => {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    throw new Error("Necesitamos la galería para adjuntar una imagen.");
  }
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    quality: 0.8,
  });
  if (result.canceled || !result.assets[0]) {
    return null;
  }
  const asset = result.assets[0];
  const mimeType = asset.mimeType ?? "image/jpeg";
  return {
    uri: asset.uri,
    mimeType,
    fileName: asset.fileName ?? fileNameFromUri(asset.uri, mimeType),
  };
};

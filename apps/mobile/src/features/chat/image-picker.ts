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

const fromAsset = (
  asset: ImagePicker.ImagePickerAsset,
): PickedChatImage => {
  const mimeType = asset.mimeType ?? "image/jpeg";
  return {
    uri: asset.uri,
    mimeType,
    fileName: asset.fileName ?? fileNameFromUri(asset.uri, mimeType),
  };
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
  return fromAsset(result.assets[0]);
};

export const pickChatVideo = async (): Promise<PickedChatImage | null> => {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    throw new Error("Necesitamos la galería para adjuntar un video.");
  }
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["videos"],
    quality: 0.8,
  });
  if (result.canceled || !result.assets[0]) {
    return null;
  }
  const asset = result.assets[0];
  const mimeType = asset.mimeType ?? "video/mp4";
  return {
    uri: asset.uri,
    mimeType,
    fileName: asset.fileName ?? `video-${Date.now()}.mp4`,
  };
};

export const takeChatPhoto = async (): Promise<PickedChatImage | null> => {
  const permission = await ImagePicker.requestCameraPermissionsAsync();
  if (!permission.granted) {
    throw new Error("Necesitamos la cámara para tomar la foto.");
  }
  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ["images"],
    quality: 0.8,
  });
  if (result.canceled || !result.assets[0]) {
    return null;
  }
  return fromAsset(result.assets[0]);
};

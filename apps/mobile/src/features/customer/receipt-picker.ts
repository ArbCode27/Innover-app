import * as ImagePicker from "expo-image-picker";

export type PickedReceipt = {
  uri: string;
  mimeType: string;
};

const asReceipt = (
  result: ImagePicker.ImagePickerResult,
): PickedReceipt | null => {
  if (result.canceled || !result.assets[0]) {
    return null;
  }
  const asset = result.assets[0];
  return {
    uri: asset.uri,
    mimeType: asset.mimeType ?? "image/jpeg",
  };
};

export const pickReceiptFromCamera = async (): Promise<PickedReceipt | null> => {
  const permission = await ImagePicker.requestCameraPermissionsAsync();
  if (!permission.granted) {
    throw new Error("Necesitamos la cámara para tomar el comprobante.");
  }
  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ["images"],
    quality: 0.8,
  });
  return asReceipt(result);
};

export const pickReceiptFromLibrary = async (): Promise<PickedReceipt | null> => {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    throw new Error("Necesitamos acceso a la galería para enviar el comprobante.");
  }
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    quality: 0.8,
  });
  return asReceipt(result);
};

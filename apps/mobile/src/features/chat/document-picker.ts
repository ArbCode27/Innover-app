import * as DocumentPicker from "expo-document-picker";

export type PickedChatDocument = {
  uri: string;
  mimeType: string;
  fileName: string;
};

export const pickChatDocument = async (): Promise<PickedChatDocument | null> => {
  const result = await DocumentPicker.getDocumentAsync({
    copyToCacheDirectory: true,
    multiple: false,
  });
  if (result.canceled || !result.assets[0]) {
    return null;
  }
  const asset = result.assets[0];
  return {
    uri: asset.uri,
    mimeType: asset.mimeType ?? "application/octet-stream",
    fileName: asset.name || `archivo-${Date.now()}`,
  };
};

import * as Clipboard from "expo-clipboard";

export const copyTextToClipboard = async (value: string) => {
  await Clipboard.setStringAsync(value);
};

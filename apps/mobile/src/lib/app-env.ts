import Constants from "expo-constants";

const trim = (value: string | undefined) => value?.trim() ?? "";

const readExtraString = (key: string) => {
  const extra = Constants.expoConfig?.extra;
  if (!extra || typeof extra !== "object") {
    return "";
  }
  const value = (extra as Record<string, unknown>)[key];
  return typeof value === "string" ? value.trim() : "";
};

export const API_BASE_URL =
  trim(process.env.EXPO_PUBLIC_API_URL) ||
  trim(process.env.EXPO_PUBLIC_API_BASE_URL) ||
  readExtraString("apiUrl") ||
  "https://innover-flow.vercel.app";

export const ORGANIZATION_SLUG = trim(
  process.env.EXPO_PUBLIC_ORGANIZATION_SLUG,
);

export const APP_CHANNEL_SECRET =
  trim(process.env.EXPO_PUBLIC_APP_CHANNEL_SECRET) ||
  readExtraString("appChannelSecret");

export const hasOrganizationSlug = () => ORGANIZATION_SLUG.length > 0;

export const hasChannelSecret = () => APP_CHANNEL_SECRET.length > 0;

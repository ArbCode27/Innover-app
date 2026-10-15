const trim = (value: string | undefined) => value?.trim() ?? "";

export const API_BASE_URL =
  trim(process.env.EXPO_PUBLIC_API_BASE_URL) || "http://localhost:3000";

export const ORGANIZATION_SLUG = trim(
  process.env.EXPO_PUBLIC_ORGANIZATION_SLUG,
);

export const APP_CHANNEL_SECRET = trim(
  process.env.EXPO_PUBLIC_APP_CHANNEL_SECRET,
);

export const hasOrganizationSlug = () => ORGANIZATION_SLUG.length > 0;

export const hasChannelSecret = () => APP_CHANNEL_SECRET.length > 0;

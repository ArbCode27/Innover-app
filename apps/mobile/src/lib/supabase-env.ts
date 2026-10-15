export const hasSupabasePublicEnv = () =>
  Boolean(
    process.env.EXPO_PUBLIC_SUPABASE_URL?.trim() &&
      process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim(),
  );

export const APP_ATTACHMENTS_BUCKET =
  process.env.EXPO_PUBLIC_APP_ATTACHMENTS_BUCKET?.trim() || "app-attachments";

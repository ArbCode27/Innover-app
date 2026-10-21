module.exports = function (api) {
  api.cache.using(
    () =>
      `${process.env.EXPO_PUBLIC_APP_CHANNEL_SECRET ?? ""}:${process.env.EXPO_PUBLIC_API_URL ?? ""}:${process.env.EXPO_PUBLIC_API_BASE_URL ?? ""}`,
  );
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
    plugins: ["react-native-reanimated/plugin"],
  };
};

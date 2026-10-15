const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const workspaceRoot = __dirname;
const mobileRoot = path.resolve(workspaceRoot, "apps/mobile");

const config = getDefaultConfig(workspaceRoot);

config.watchFolders = [workspaceRoot, mobileRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(workspaceRoot, "node_modules"),
  path.resolve(mobileRoot, "node_modules"),
];

module.exports = withNativeWind(config, {
  input: path.resolve(mobileRoot, "global.css"),
  inlineRem: 16,
});

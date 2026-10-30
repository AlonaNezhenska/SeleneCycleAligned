const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// The engine, design tokens and day derivation live in the web app's src/
// and are shared, not copied. Only those pure modules are imported from it.
config.watchFolders = [path.resolve(__dirname, "../src")];

module.exports = config;

jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock")
);
jest.mock("react-native-safe-area-context", () => require("react-native-safe-area-context/jest/mock").default);
jest.mock("expo-router", () => ({
  router: { push: jest.fn(), replace: jest.fn(), back: jest.fn(), navigate: jest.fn(), canGoBack: jest.fn(() => false) },
  Redirect: () => null,
  useLocalSearchParams: jest.fn(() => ({})),
}));
jest.mock("expo-image-picker", () => ({
  requestCameraPermissionsAsync: jest.fn(async () => ({ granted: true })),
  launchCameraAsync: jest.fn(async () => ({ canceled: false, assets: [{ uri: "file://baseline.jpg" }] })),
  launchImageLibraryAsync: jest.fn(async () => ({ canceled: false, assets: [{ uri: "file://baseline.jpg" }] })),
}));
// Tests run with online backup switched off, as on a build without keys.
jest.mock("./src/lib/supabase", () => ({ supabase: null, backupAvailable: false }));
jest.mock("expo-blur", () => {
  const React = require("react");
  const { View } = require("react-native");
  return {
    BlurView: (props) => React.createElement(View, props),
    BlurTargetView: React.forwardRef((props, ref) => React.createElement(View, { ...props, ref })),
  };
});

const baseConfig = require("./app.json");

const IS_PRODUCTION_PROFILE = process.env.EAS_BUILD_PROFILE === "production";
const IS_PREVIEW_PROFILE = process.env.EAS_BUILD_PROFILE === "preview";
const IS_RELEASE_BUILD = IS_PRODUCTION_PROFILE || IS_PREVIEW_PROFILE;
const apiUrl = process.env.EXPO_PUBLIC_API_URL;
const webUrl = process.env.EXPO_PUBLIC_WEB_URL;
const LOCALHOST_API_URL_PATTERN =
  /^https?:\/\/(localhost|127\.0\.0\.1)(:|\/|$)/;

if (IS_RELEASE_BUILD && !apiUrl) {
  throw new Error(
    "EXPO_PUBLIC_API_URL must be set for preview and production mobile builds."
  );
}

if (IS_RELEASE_BUILD && LOCALHOST_API_URL_PATTERN.test(apiUrl)) {
  throw new Error(
    "EXPO_PUBLIC_API_URL must not point at localhost for preview or production mobile builds."
  );
}

if (IS_RELEASE_BUILD && process.env.EXPO_PUBLIC_AUTH_MODE === "mock") {
  throw new Error(
    "EXPO_PUBLIC_AUTH_MODE=mock must not be enabled for preview or production mobile builds."
  );
}

module.exports = {
  expo: {
    ...baseConfig.expo,
    extra: {
      ...baseConfig.expo.extra,
      apiUrl: apiUrl ?? "http://localhost:3000",
      webUrl: webUrl ?? apiUrl ?? "http://localhost:3000",
    },
  },
};

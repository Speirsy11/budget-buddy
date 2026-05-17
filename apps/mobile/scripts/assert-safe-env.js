#!/usr/bin/env node
/* global console, process */

const isReleaseProfile = ["preview", "production"].includes(
  process.env.EAS_BUILD_PROFILE
);
const apiUrl = process.env.EXPO_PUBLIC_API_URL;
const mockModeEnabled = process.env.EXPO_PUBLIC_AUTH_MODE === "mock";
const localhostPattern = /^https?:\/\/(localhost|127\.0\.0\.1)(:|\/|$)/;

if (isReleaseProfile && mockModeEnabled) {
  console.error(
    "EXPO_PUBLIC_AUTH_MODE=mock is only allowed for local development."
  );
  process.exit(1);
}

if (isReleaseProfile && !apiUrl) {
  console.error(
    "EXPO_PUBLIC_API_URL must be set for preview and production mobile builds."
  );
  process.exit(1);
}

if (isReleaseProfile && localhostPattern.test(apiUrl)) {
  console.error(
    "EXPO_PUBLIC_API_URL must not point at localhost for preview or production mobile builds."
  );
  process.exit(1);
}

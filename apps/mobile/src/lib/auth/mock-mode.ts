export const isMockAuthMode =
  __DEV__ && process.env.EXPO_PUBLIC_AUTH_MODE === "mock";

export const mockUser = {
  firstName: "Local",
  fullName: "Local Mock User",
  emailAddresses: [{ emailAddress: "local@example.test" }],
};

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  devAuthUserId,
  isDevAuthEnabled,
  assertDevAuthNotInProduction,
} from "./dev-auth";

const originalNodeEnv = process.env.NODE_ENV;
const originalUserId = process.env.DEV_AUTH_USER_ID;

function setEnv(nodeEnv: string | undefined, userId: string | undefined) {
  // NODE_ENV is typed readonly by Next.js but is an ordinary string at
  // runtime; process.env rejects defineProperty, so assign through a cast.
  const env = process.env as Record<string, string | undefined>;
  if (nodeEnv === undefined) delete env.NODE_ENV;
  else env.NODE_ENV = nodeEnv;

  if (userId === undefined) delete env.DEV_AUTH_USER_ID;
  else env.DEV_AUTH_USER_ID = userId;
}

beforeEach(() => setEnv("development", undefined));
afterEach(() => setEnv(originalNodeEnv, originalUserId));

describe("devAuthUserId", () => {
  it("returns the configured user in development", () => {
    setEnv("development", "user_abc123");
    expect(devAuthUserId()).toBe("user_abc123");
    expect(isDevAuthEnabled()).toBe(true);
  });

  it("is off when the variable is unset", () => {
    setEnv("development", undefined);
    expect(devAuthUserId()).toBeNull();
    expect(isDevAuthEnabled()).toBe(false);
  });

  it("ignores a blank or whitespace-only value", () => {
    setEnv("development", "   ");
    expect(devAuthUserId()).toBeNull();
  });

  it("is ignored in production even when set", () => {
    // The load-bearing assertion: a production build cannot be talked into
    // bypassing authentication, whatever the environment says.
    setEnv("production", "user_abc123");
    expect(devAuthUserId()).toBeNull();
    expect(isDevAuthEnabled()).toBe(false);
  });

  it("is ignored in test environments", () => {
    setEnv("test", "user_abc123");
    expect(devAuthUserId()).toBeNull();
  });
});

describe("assertDevAuthNotInProduction", () => {
  it("throws when an auth bypass is configured in production", () => {
    setEnv("production", "user_abc123");
    expect(() => assertDevAuthNotInProduction()).toThrow(
      /must never be set outside local development/i
    );
  });

  it("permits a production build with the variable unset", () => {
    setEnv("production", undefined);
    expect(() => assertDevAuthNotInProduction()).not.toThrow();
  });

  it("permits development with the variable set", () => {
    setEnv("development", "user_abc123");
    expect(() => assertDevAuthNotInProduction()).not.toThrow();
  });
});

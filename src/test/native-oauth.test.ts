import { describe, expect, it } from "vitest";
import {
  buildNativeGoogleOAuthUrl,
  isValidNativeOAuthState,
  NATIVE_OAUTH_CALLBACK_URI,
  NATIVE_OAUTH_STATE_TTL_MS,
  parseNativeOAuthCallback,
  parsePendingNativeOAuthState,
} from "@/lib/native-oauth";

describe("Android Google OAuth callback", () => {
  it("starts Google sign-in with the app callback and one-time state", () => {
    const url = new URL(buildNativeGoogleOAuthUrl("state-123"));

    expect(url.origin).toBe("https://saplant.lovable.app");
    expect(url.pathname).toBe("/~oauth/initiate");
    expect(url.searchParams.get("provider")).toBe("google");
    expect(url.searchParams.get("redirect_uri")).toBe(NATIVE_OAUTH_CALLBACK_URI);
    expect(url.searchParams.get("state")).toBe("state-123");
  });

  it("reads session tokens and state from a callback fragment", () => {
    expect(
      parseNativeOAuthCallback(
        `${NATIVE_OAUTH_CALLBACK_URI}#access_token=access&refresh_token=refresh&state=state-123`,
      ),
    ).toEqual({
      state: "state-123",
      accessToken: "access",
      refreshToken: "refresh",
      error: null,
    });
  });

  it("reads provider errors from a callback query", () => {
    expect(
      parseNativeOAuthCallback(`${NATIVE_OAUTH_CALLBACK_URI}?error=access_denied&state=state-123`),
    ).toEqual({ state: "state-123", accessToken: null, refreshToken: null, error: "access_denied" });
  });

  it("rejects callbacks for a different app URI", () => {
    expect(parseNativeOAuthCallback("https://saplant.lovable.app/auth")).toBeNull();
  });
});

describe("Android OAuth state validation", () => {
  it("accepts only the matching, unexpired callback state", () => {
    const now = 1_800_000_000_000;

    expect(isValidNativeOAuthState("state-123", "state-123", now - 1000, now)).toBe(true);
    expect(isValidNativeOAuthState("state-123", "other", now - 1000, now)).toBe(false);
    expect(isValidNativeOAuthState("state-123", "state-123", now - NATIVE_OAUTH_STATE_TTL_MS - 1, now)).toBe(false);
  });

  it("rejects malformed saved state", () => {
    expect(parsePendingNativeOAuthState("not-json")).toBeNull();
    expect(parsePendingNativeOAuthState(JSON.stringify({ state: "state-123", createdAt: 42 }))).toEqual({
      state: "state-123",
      createdAt: 42,
    });
  });
});
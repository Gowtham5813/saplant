import { NATIVE_OAUTH_BROKER_URL } from "@/lib/oauth-redirect";

export const NATIVE_OAUTH_CALLBACK_URI =
  "app.lovable.e9554181d8f446bfa847e6a0fb0213a2://oauth-callback";
export const NATIVE_OAUTH_PENDING_STATE_KEY = "saplant:android:google-oauth-state";
export const NATIVE_OAUTH_STATE_TTL_MS = 10 * 60 * 1000;

export interface NativeOAuthCallback {
  state: string | null;
  accessToken: string | null;
  refreshToken: string | null;
  error: string | null;
}

export interface PendingNativeOAuthState {
  state: string;
  createdAt: number;
}

export const createNativeOAuthState = () => {
  if (typeof globalThis.crypto?.getRandomValues !== "function") {
    throw new Error("Secure random values are unavailable");
  }

  const bytes = globalThis.crypto.getRandomValues(new Uint8Array(32));
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
};

export const buildNativeGoogleOAuthUrl = (state: string) => {
  const url = new URL(NATIVE_OAUTH_BROKER_URL);
  url.searchParams.set("provider", "google");
  url.searchParams.set("redirect_uri", NATIVE_OAUTH_CALLBACK_URI);
  url.searchParams.set("state", state);
  return url.toString();
};

export const parseNativeOAuthCallback = (callbackUrl: string): NativeOAuthCallback | null => {
  let url: URL;
  try {
    url = new URL(callbackUrl);
  } catch {
    return null;
  }

  const expectedCallback = new URL(NATIVE_OAUTH_CALLBACK_URI);
  if (
    url.protocol !== expectedCallback.protocol ||
    url.hostname !== expectedCallback.hostname ||
    (url.pathname !== "" && url.pathname !== "/")
  ) {
    return null;
  }

  const fragment = url.hash.replace(/^#/, "").replace(/^\?/, "");
  const hashParams = new URLSearchParams(fragment);
  const read = (key: string) => url.searchParams.get(key) ?? hashParams.get(key);

  return {
    state: read("state"),
    accessToken: read("access_token"),
    refreshToken: read("refresh_token"),
    error: read("error"),
  };
};

export const parsePendingNativeOAuthState = (
  serializedState: string | null,
): PendingNativeOAuthState | null => {
  if (!serializedState) return null;

  try {
    const value: unknown = JSON.parse(serializedState);
    if (
      typeof value !== "object" ||
      value === null ||
      !("state" in value) ||
      !("createdAt" in value) ||
      typeof value.state !== "string" ||
      typeof value.createdAt !== "number"
    ) {
      return null;
    }

    return { state: value.state, createdAt: value.createdAt };
  } catch {
    return null;
  }
};

export const isValidNativeOAuthState = (
  pendingState: string | null,
  callbackState: string | null,
  createdAt: number,
  now = Date.now(),
) =>
  Boolean(
    pendingState &&
      callbackState &&
      pendingState === callbackState &&
      Number.isFinite(createdAt) &&
      createdAt <= now &&
      now - createdAt <= NATIVE_OAUTH_STATE_TTL_MS,
  );
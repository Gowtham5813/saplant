import { describe, expect, it } from "vitest";
import {
  getOAuthRedirectOrigin,
  NATIVE_OAUTH_BROKER_URL,
  PUBLISHED_APP_ORIGIN,
} from "@/lib/oauth-redirect";

describe("mobile OAuth redirects", () => {
  it("uses the published OAuth broker instead of the Android localhost origin", () => {
    expect(NATIVE_OAUTH_BROKER_URL).toBe("https://saplant.lovable.app/~oauth/initiate");
  });

  it("returns native sign-in to the published app and preserves web origins", () => {
    expect(getOAuthRedirectOrigin(true, "http://localhost")).toBe(PUBLISHED_APP_ORIGIN);
    expect(getOAuthRedirectOrigin(false, "https://preview.saplant.lovable.app")).toBe(
      "https://preview.saplant.lovable.app",
    );
  });
});
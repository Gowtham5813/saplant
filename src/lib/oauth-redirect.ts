export const PUBLISHED_APP_ORIGIN = "https://saplant.lovable.app";
export const NATIVE_OAUTH_BROKER_URL = `${PUBLISHED_APP_ORIGIN}/~oauth/initiate`;

export const getOAuthRedirectOrigin = (isNativeApp: boolean, currentOrigin: string) =>
  isNativeApp ? PUBLISHED_APP_ORIGIN : currentOrigin;
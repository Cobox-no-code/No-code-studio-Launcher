export const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "https://api.cobox.games/api";

export const APP_ENV = process.env.NEXT_PUBLIC_APP_ENV || "development";

export const IS_DEV = APP_ENV === "development";
export const IS_PROD = APP_ENV === "production";

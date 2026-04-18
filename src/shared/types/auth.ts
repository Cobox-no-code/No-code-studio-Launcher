export interface AuthUser {
  id: number | string;
  name: string;
  email: string;
  mobile_number?: string;
  role?: string;
  avatar_url?: string;
  kyc_status?: string;
  country_code?: string;
  created_at?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export type AuthStatus =
  | "signed-out"
  | "awaiting-browser" // waiting for user to complete login in browser
  | "signed-in"
  | "error";

export interface AuthState {
  status: AuthStatus;
  user: AuthUser | null;
  tokenId: string | null; // the one-time launcher verification token (only during awaiting-browser)
  error: string | null;
}

export interface StartLoginResult {
  success: boolean;
  tokenId?: string;
  browserUrl?: string;
  error?: string;
}

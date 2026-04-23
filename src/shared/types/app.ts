export interface AppVersionInfo {
  version: string;
  buildDate: string;
  platform: string;
}

export interface ProfileUpdateParams {
  displayName?: string;
}

export interface ProfileUpdateResult {
  success: boolean;
  error?: string;
}

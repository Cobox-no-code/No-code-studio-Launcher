import { atomicWriteJson, readJsonOrEmpty } from "./atomic-write";
import { secretFilePath } from "./paths";

export interface SecretConfig {
  accessToken?: string;
  refreshToken?: string;
  userId?: string | number;
  [key: string]: unknown;
}

export const secretStore = {
  read(): SecretConfig {
    return readJsonOrEmpty<SecretConfig>(secretFilePath());
  },

  /** Upsert — reinstalls won't lock users out. */
  upsert(updates: Partial<SecretConfig>): SecretConfig {
    const merged = { ...this.read(), ...updates };
    atomicWriteJson(secretFilePath(), merged);
    return merged;
  },
};

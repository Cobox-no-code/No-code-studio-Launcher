/**
 * Username + Identity types — mirrors backend `/users/username/*` endpoints.
 *
 * Username is a stable handle that will eventually map to a subdomain
 * (e.g. `alice.cobox.games`) and back an Identity NFT. While `identityStatus`
 * is `unminted` or `failed`, the user can change it freely. Once `minted`,
 * it's locked.
 */

export type UnavailableReason =
  | "too_short"
  | "too_long"
  | "invalid_format"
  | "consecutive_underscores"
  | "reserved"
  | "taken";

export interface UsernameAvailabilityResponse {
  available: boolean;
  username: string;
  reason?: UnavailableReason;
  suggestions?: string[];
}

export type IdentityStatus = "unminted" | "minting" | "minted" | "failed";

export interface UserIdentityStatus {
  username: string | null;
  identityStatus: IdentityStatus;
  identityTokenId: string | null;
  identityContractAddress: string | null;
  /** 56 = BSC mainnet, 97 = BSC testnet */
  identityChainId: number | null;
  /** ISO 8601 timestamp */
  identityMintedAt: string | null;
  canChangeUsername: boolean;
}

export interface UpdateUsernameRequest {
  username: string;
}

export interface UpdateUsernameResponse {
  username: string;
  changed: boolean;
  previousUsername?: string;
}

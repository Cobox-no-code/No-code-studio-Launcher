export type UpdateStatus =
  | "idle"
  | "checking"
  | "available"
  | "downloading"
  | "downloaded"
  | "error";

export interface UpdateStatePayload {
  status: UpdateStatus;
  version: string | null;
  percent: number;
  error: string | null;
}

export interface UpdateCheckResult {
  success: boolean;
  updateInfo: { version: string } | null;
  message?: string;
}

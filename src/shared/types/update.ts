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

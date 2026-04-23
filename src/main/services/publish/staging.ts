import fs from "fs";
import os from "os";
import path from "path";
import { randomUUID } from "crypto";
import { log } from "@main/utils/logger";

export interface StagedFile {
  filePath: string;
  mimeType: string;
  size: number;
}

/**
 * Write a renderer-provided Uint8Array to a temp file and return the path.
 * Used to hand a File from the renderer into services that need a disk path.
 */
export function stageThumbnailBytes(params: {
  bytes: Uint8Array;
  originalName: string;
  mimeType: string;
}): StagedFile {
  const dir = path.join(os.tmpdir(), "cobox-launcher", "thumbs");
  fs.mkdirSync(dir, { recursive: true });

  const ext = path.extname(params.originalName) || ".png";
  const filePath = path.join(dir, `${randomUUID()}${ext}`);
  fs.writeFileSync(filePath, params.bytes);

  log.info(
    `Staged thumbnail to ${filePath} (${params.bytes.byteLength} bytes)`,
  );
  return {
    filePath,
    mimeType: params.mimeType,
    size: params.bytes.byteLength,
  };
}

/**
 * Best-effort cleanup — call after upload completes so temp files don't pile up.
 */
export function cleanupStagedFile(filePath: string) {
  try {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  } catch {
    /* ignore */
  }
}

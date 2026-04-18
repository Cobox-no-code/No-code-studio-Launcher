import { BrowserWindow } from "electron";

/**
 * Send to renderer only if the window is alive.
 * Prevents "Object has been destroyed" crashes during teardown.
 */
export function safeSend(
  win: BrowserWindow | null,
  channel: string,
  data?: unknown,
): void {
  if (win && !win.isDestroyed() && win.webContents) {
    win.webContents.send(channel, data);
  }
}

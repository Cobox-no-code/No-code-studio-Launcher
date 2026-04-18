import { contextBridge, ipcRenderer, IpcRendererEvent } from "electron";
import type { IpcResponse } from "../shared/types/ipc";
import { IPC } from "../shared/types/ipc-contract";
import type {
  UpdateCheckResult,
  UpdateStatePayload,
} from "../shared/types/update";

// ─────────────────────────────────────────────────────────────────────────────
// _listenerMap lives at module scope — NOT inside the exposed object.
// contextBridge can't reliably clone a Map on older Electron versions.
// ─────────────────────────────────────────────────────────────────────────────
const _listenerMap = new Map<
  string,
  (event: IpcRendererEvent, ...args: unknown[]) => void
>();

function subscribe(
  channel: string,
  handler: (data: unknown) => void,
): () => void {
  const prev = _listenerMap.get(channel);
  if (prev) ipcRenderer.removeListener(channel, prev);

  const listener = (_e: IpcRendererEvent, data: unknown) => handler(data);
  ipcRenderer.on(channel, listener);
  _listenerMap.set(channel, listener);

  return () => {
    ipcRenderer.removeListener(channel, listener);
    _listenerMap.delete(channel);
  };
}

const api = {
  updater: {
    check: (): Promise<UpdateCheckResult> =>
      ipcRenderer.invoke(IPC.updater.check),
    download: (): Promise<IpcResponse> =>
      ipcRenderer.invoke(IPC.updater.download),
    install: (): Promise<IpcResponse> =>
      ipcRenderer.invoke(IPC.updater.install),
    getState: (): Promise<UpdateStatePayload> =>
      ipcRenderer.invoke(IPC.updater.getState),
    onStateChanged: (cb: (s: UpdateStatePayload) => void): (() => void) =>
      subscribe(IPC.updater.stateChanged, (data) =>
        cb(data as UpdateStatePayload),
      ),
  },
};

export type CoboxAPI = typeof api;

try {
  contextBridge.exposeInMainWorld("cobox", api);
  console.log("cobox API exposed");
} catch (err) {
  console.error("FATAL: preload exposure failed:", err);
}

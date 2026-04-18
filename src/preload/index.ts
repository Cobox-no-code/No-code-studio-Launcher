import { contextBridge } from "electron";

contextBridge.exposeInMainWorld("electronAPI", {
  // empty for now — we'll fill this after boot works
});

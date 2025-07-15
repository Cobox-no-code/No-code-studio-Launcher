import { contextBridge, ipcRenderer, IpcRendererEvent } from "electron";

console.log("Preload script is loading...");

export const api = {
  on: (channel: string, callback: Function) => {
    ipcRenderer.on(channel, (event: IpcRendererEvent, args: any) =>
      callback(event, args)
    );
  },

  send: (channel: string, args: any): void => {
    ipcRenderer.send(channel, args);
  },

  sendSync: (channel: string, args: any): any => {
    return ipcRenderer.sendSync(channel, args);
  },
};

const electronAPI = {
  chooseInstallPath: () => ipcRenderer.invoke("choose-install-path"),
  downloadGame: (params) => {
    console.log("Preload: downloadGame called with:", params);
    console.log("Preload: params type:", typeof params);
    console.log("Preload: params keys:", params ? Object.keys(params) : "null");
    return ipcRenderer.invoke("download-game", params);
  },
  launchGame: (exePath) => ipcRenderer.invoke("launch-game", exePath),
  openExternal: (url) => ipcRenderer.invoke("open-external", url),
  checkGameInstallation: (gamePath) =>
    ipcRenderer.invoke("check-game-installation", gamePath),
  getDefaultInstallPath: () => ipcRenderer.invoke("get-default-install-path"),
};

try {
  contextBridge.exposeInMainWorld("electronAPI", electronAPI);
  console.log("Successfully exposed electronAPI to main world");
} catch (error) {
  console.error("Failed to expose electronAPI:", error);
}

import { contextBridge, ipcRenderer, IpcRendererEvent } from "electron";
import { machineIdSync } from "node-machine-id";

contextBridge.exposeInMainWorld("deviceAPI", {
  getDeviceId: () => machineIdSync(),
});
export const api = {
  /**
   * Registers a callback function to be invoked when a message is received on the specified IPC channel.
   *
   * @param {string} channel - The name of the IPC channel to listen on.
   * @param {Function} callback - The callback function to be invoked when a message is received.
   *                             The callback function will receive two parameters: the event object and the message data.
   */
  on: (channel: string, callback: Function) => {
    ipcRenderer.on(channel, (event: IpcRendererEvent, args: any) =>
      callback(event, args)
    );
  },

  /**
   * Sends a message through the IPC channel with the specified channel name and arguments.
   *
   * @param {string} channel - The name of the IPC channel to send the message through.
   * @param {any} args - The arguments to send along with the message.
   * @return {void} This function does not return anything.
   */
  send: (channel: string, args: any): void => {
    ipcRenderer.send(channel, args);
  },

  /**
   * Sends a synchronous message through the IPC channel with the specified channel name and arguments.
   *
   * @param {string} channel - The name of the IPC channel to send the message through.
   * @param {any} args - The arguments to send along with the message.
   * @return {any} The response from the main process.
   */
  sendSync: (channel: string, args: any): any => {
    return ipcRenderer.sendSync(channel, args);
  },
};
contextBridge.exposeInMainWorld("electronAPI", {
  // Install update with admin privileges
  installUpdate: (fileName: string) => {
    return ipcRenderer.invoke("install-update", fileName);
  },

  // Install update silently
  installUpdateSilent: (fileName: string) => {
    return ipcRenderer.invoke("install-update-silent", fileName);
  },

  // Quit the application
  quitApp: () => {
    return ipcRenderer.invoke("quit-app");
  },

  // Restart the application
  restartApp: () => {
    return ipcRenderer.invoke("restart-app");
  },

  // Get app version
  getAppVersion: () => {
    return ipcRenderer.invoke("get-app-version");
  },

  // Check if downloaded file exists
  checkFileExists: (fileName: string) => {
    return ipcRenderer.invoke("check-file-exists", fileName);
  },

  // Listen for installation progress (if needed)
  onInstallProgress: (callback: (progress: any) => void) => {
    ipcRenderer.on("install-progress", (event, progress) => callback(progress));
  },

  // Remove installation progress listener
  removeInstallProgressListener: () => {
    ipcRenderer.removeAllListeners("install-progress");
  },

  // Platform info
  platform: process.platform,

  // Additional utility methods
  openExternal: (url: string) => {
    return ipcRenderer.invoke("open-external", url);
  },
});

contextBridge.exposeInMainWorld("api", api);

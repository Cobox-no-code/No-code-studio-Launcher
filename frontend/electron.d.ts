interface ElectronAPI {
  chooseInstallPath: () => Promise<string | null>;
  downloadGame: (params: { url: string; targetDir: string }) => Promise<string>;
  launchGame: (exePath: string) => Promise<{ success: boolean }>;
  openExternal: (url: string) => Promise<{ success: boolean; error?: string }>;
  checkGameInstallation: (
    gamePath: string
  ) => Promise<{ installed: boolean; path?: string }>;
  getDefaultInstallPath: () => Promise<string>;
  checkForUpdates: () => Promise<void>;
  installUpdate: () => Promise<void>;
  onUpdateEvent: (callback: (event: string, data: any) => void) => void;
  removeUpdateListener: () => void;
  _updateListeners: Map<
    string,
    (event: IpcRendererEvent, ...args: any[]) => void
  >;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

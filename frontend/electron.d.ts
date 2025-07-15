interface ElectronAPI {
  chooseInstallPath: () => Promise<string | null>;
  downloadGame: (params: { url: string; targetDir: string }) => Promise<string>;
  launchGame: (exePath: string) => Promise<{ success: boolean }>;
  openExternal: (url: string) => Promise<{ success: boolean; error?: string }>;
  checkGameInstallation: (
    gamePath: string
  ) => Promise<{ installed: boolean; path?: string }>;
  getDefaultInstallPath: () => Promise<string>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

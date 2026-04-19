export type BootstrapPhase =
  | "initializing"
  | "intro-videos" // first run only
  | "checking" // comparing versions
  | "launcher-updating" // pulling electron-updater bits
  | "game-downloading" // pulling No Code Studio
  | "game-installing" // extracting zip
  | "ready" // routing forward
  | "error";

export interface BootstrapState {
  phase: BootstrapPhase;
  firstRun: boolean;
  introCompleted: boolean;

  launcherUpdate: {
    available: boolean;
    version: string | null;
    percent: number;
  };

  gameDownload: {
    status:
      | "idle"
      | "checking"
      | "downloading"
      | "extracting"
      | "installed"
      | "error";
    currentVersion: string | null; // what's installed locally
    targetVersion: string | null; // what the server has
    percent: number;
    error: string | null;
  };

  error: string | null;
}

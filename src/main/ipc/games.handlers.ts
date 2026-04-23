import { IPC } from "@shared/ipc-contract";
import { BrowserWindow, ipcMain } from "electron";

import { downloadAndExtractGame } from "@main/services/games/download.service";
import {
  checkInstallationAt,
  chooseInstallPath,
  getDefaultInstallPath,
  getGameStatus,
} from "@main/services/games/install.service";
import {
  launchGame,
  launchPlayGame,
  launchWithIntent,
} from "@main/services/games/launch.service";
import {
  checkDownloadStatus,
  deleteLiveGame,
  downloadLiveGame,
  getLocalLibrary,
} from "@main/services/games/live-games.service";
import { getServerVersion } from "@main/services/games/version.service";
import {
  LaunchWithIntentParams,
  LiveGameDownloadParams,
  PlayLiveGameParams,
} from "@shared/types/game";
import { log } from "electron-log";

export function registerGamesHandlers(getWin: () => BrowserWindow | null) {
  ipcMain.handle(IPC.games.getServerVersion, () => getServerVersion());
  ipcMain.handle(IPC.games.getDefaultInstallPath, () =>
    getDefaultInstallPath(),
  );
  ipcMain.handle(IPC.games.chooseInstallPath, () => chooseInstallPath());

  ipcMain.handle(IPC.games.download, (_e, params) =>
    downloadAndExtractGame(params, getWin),
  );

// In your IPC handler for launch:
ipcMain.handle(IPC.games.launch, async (_e) => {
  const result = launchGame();
  if (!result.success && result.error?.includes("Studio")) {
  
  }
  return result;
});
  ipcMain.handle(IPC.games.getStatus, () => getGameStatus());
  ipcMain.handle(IPC.games.checkInstallation, (_e, gamePath: string) =>
    checkInstallationAt(gamePath),
  );

  ipcMain.handle(
    IPC.games.liveGameDownload,
    (_e, params: LiveGameDownloadParams) => downloadLiveGame(params, getWin),
    //                                                                 ^^^^^^
    //                                      this second argument was missing
  );
  ipcMain.handle(IPC.games.checkDownloadStatus, (_e, ids: string[]) =>
    checkDownloadStatus(ids),
  );
  ipcMain.handle(IPC.games.deleteLive, (_e, { gameId }: { gameId: string }) =>
    deleteLiveGame(gameId),
  );

  // inside registerGamesHandlers:
  ipcMain.handle(
    IPC.games.launchWithIntent,
    (_e, params: LaunchWithIntentParams) => launchWithIntent(params.intent),
  );

  ipcMain.handle(IPC.games.liveGameCheckStatus, (_e, gameIds: string[]) =>
    checkDownloadStatus(gameIds ?? []),
  );

  ipcMain.handle(IPC.games.liveGameDelete, (_e, gameId: string) =>
    deleteLiveGame(gameId),
  );

  ipcMain.handle(IPC.games.playLiveGame, (_e, params: PlayLiveGameParams) =>
    launchPlayGame(params),
  );
  ipcMain.handle(IPC.games.liveGameGetLibrary, () => getLocalLibrary());
}

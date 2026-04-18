import { ipcMain, BrowserWindow } from "electron";
import { IPC } from "@shared/types/ipc-contract";

import { getServerVersion } from "@main/services/games/version.service";
import { downloadAndExtractGame } from "@main/services/games/download.service";
import {
  chooseInstallPath,
  getDefaultInstallPath,
  getGameStatus,
  checkInstallationAt,
} from "@main/services/games/install.service";
import { launchGame } from "@main/services/games/launch.service";
import {
  downloadLiveGame,
  checkDownloadStatus,
  deleteLiveGame,
  getLocalLibrary,
} from "@main/services/games/live-games.service";

export function registerGamesHandlers(getWin: () => BrowserWindow | null) {
  ipcMain.handle(IPC.games.getServerVersion, () => getServerVersion());
  ipcMain.handle(IPC.games.getDefaultInstallPath, () =>
    getDefaultInstallPath(),
  );
  ipcMain.handle(IPC.games.chooseInstallPath, () => chooseInstallPath());

  ipcMain.handle(IPC.games.download, (_e, params) =>
    downloadAndExtractGame(params, getWin),
  );

  ipcMain.handle(IPC.games.launch, () => launchGame());
  ipcMain.handle(IPC.games.getStatus, () => getGameStatus());
  ipcMain.handle(IPC.games.checkInstallation, (_e, gamePath: string) =>
    checkInstallationAt(gamePath),
  );

  ipcMain.handle(IPC.games.downloadLive, (_e, params) =>
    downloadLiveGame(params),
  );
  ipcMain.handle(IPC.games.checkDownloadStatus, (_e, ids: string[]) =>
    checkDownloadStatus(ids),
  );
  ipcMain.handle(IPC.games.deleteLive, (_e, { gameId }: { gameId: string }) =>
    deleteLiveGame(gameId),
  );
  ipcMain.handle(IPC.games.getLocalLibrary, () => getLocalLibrary());
}

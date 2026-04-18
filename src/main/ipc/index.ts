import { BrowserWindow } from "electron";
import { registerGamesHandlers } from "./games.handlers";
import { registerUpdaterHandlers } from "./updater.handlers";

export function registerAllHandlers(getWin: () => BrowserWindow | null) {
  registerUpdaterHandlers();
  registerGamesHandlers(getWin);
  // Future: auth, publish
}

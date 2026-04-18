import { BrowserWindow } from "electron";
import { registerGamesHandlers } from "./games.handlers";
import { registerUpdaterHandlers } from "./updater.handlers";
import { registerAuthHandlers } from "./auth.handlers";

export function registerAllHandlers(getWin: () => BrowserWindow | null) {
  registerUpdaterHandlers();
  registerGamesHandlers(getWin);
  registerAuthHandlers();
  // Future: auth, publish
}

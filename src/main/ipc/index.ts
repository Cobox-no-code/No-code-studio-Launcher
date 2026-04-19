import { BrowserWindow } from "electron";
import { registerGamesHandlers } from "./games.handlers";
import { registerUpdaterHandlers } from "./updater.handlers";
import { registerAuthHandlers } from "./auth.handlers";
import { registerPublishHandlers } from "./publish.handlers";
import { registerBootstrapHandlers } from "./bootstrap.handlers";

export function registerAllHandlers(getWin: () => BrowserWindow | null) {
  registerUpdaterHandlers();
  registerGamesHandlers(getWin);
  registerAuthHandlers();
  registerPublishHandlers(getWin);
  registerBootstrapHandlers();
  // Future: auth, publish
}

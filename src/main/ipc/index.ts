import { BrowserWindow } from "electron";
import { registerAuthHandlers } from "./auth.handlers";
import { registerBootstrapHandlers } from "./bootstrap.handlers";
import { registerGamesHandlers } from "./games.handlers";
import { registerPublishHandlers } from "./publish.handlers";
import { registerUpdaterHandlers } from "./updater.handlers";
import { registerAppHandlers } from "./app.handlers";

export function registerAllHandlers(getWin: () => BrowserWindow | null) {
  registerUpdaterHandlers();
  registerGamesHandlers(getWin);
  registerAuthHandlers();
  registerPublishHandlers(getWin);
  registerBootstrapHandlers();
  registerAppHandlers();
  // Future: auth, publish
}

import { registerUpdaterHandlers } from "./updater.handlers";

export function registerAllHandlers() {
  registerUpdaterHandlers();
  // Future: registerGamesHandlers(), registerAuthHandlers(), etc.
}

import log from "electron-log";
import { app } from "electron";
import path from "path";

let initialized = false;

export function initLogger() {
  if (initialized) return;
  log.transports.file.level = "info";
  log.transports.console.level = "debug";
  log.transports.file.resolvePathFn = () =>
    path.join(app.getPath("userData"), "logs", "main.log");
  initialized = true;
  log.info("Logger initialised");
}

export { log };

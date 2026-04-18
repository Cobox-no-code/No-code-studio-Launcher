import { app, BrowserWindow } from "electron";
import { join } from "path";

import { registerAllHandlers } from "@main/ipc";
import { getAppDataPath } from "@main/persistence/paths";
import { initAuthService } from "@main/services/auth/auth.service";
import { initUpdaterService } from "@main/services/updater/updater.service";
import { initLogger, log } from "@main/utils/logger";
let mainWindow: BrowserWindow | null = null;
export const getMainWindow = () => mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1250,
    height: 750,
    resizable: false,
    fullscreenable: false,
    maximizable: false,
    webPreferences: {
      preload: join(__dirname, "../preload/index.js"),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  if (process.env["ELECTRON_RENDERER_URL"]) {
    mainWindow.loadURL(process.env["ELECTRON_RENDERER_URL"]);
  } else {
    mainWindow.loadFile(join(__dirname, "../renderer/index.html"));
  }

  mainWindow.on("closed", () => (mainWindow = null));
}

app.whenReady().then(async () => {
  initLogger();
  getAppDataPath(); // warms the lazy init + ensures dir exists
  registerAllHandlers(getMainWindow);
  initUpdaterService(getMainWindow);
  createWindow();

  await initAuthService(getMainWindow);
  log.info(`Launcher v${app.getVersion()} started`);

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

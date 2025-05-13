import { app, BrowserWindow, } from "electron";
import { join } from "node:path";
import { initLogs, isDev, prepareNext } from "./utils";
import backendProcess from "./app";

/**
 * Creates the main application window.
 *
 * The window is created with the following options:
 *
 * - `width`: 900
 * - `height`: 700
 * - `webPreferences`:
 *   - `nodeIntegration`: false
 *   - `contextIsolation`: true
 *   - `preload`: the path to the preload script
 *
 * If the application is running in development mode, the window is loaded with
 * the URL "http://localhost:4444/", and the devtools are opened. The window is
 * also maximized.
 *
 * If the application is running in production mode, the window is loaded with
 * the path to the main application HTML file, and the menu is set to null.
 */
function createWindow(): void {
  const win = new BrowserWindow({
    width: 900,
    height: 700,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: join(__dirname, "preload.js"),
    },
  });

  if (isDev) {
    win.loadURL("http://localhost:4444/");
    win.webContents.openDevTools();
    win.maximize();
  } else {
    win.loadFile(join(__dirname, "..", "frontend", "out", "index.html"));
   win.setMenu(null)
  }
}
function startBackendServer() {
  const backendJS = backendProcess;

  console.log("🟡 Launching backend with: node", backendJS);

  backendJS.on("error", (err) => {
    console.error("❌ Backend server failed to start:", err);
  });

  backendJS.on("exit", (code) => {
    console.error("❌ Backend server exited with code:", code);
  });
}
/**
 * When the application is ready, this function is called.
 *
 * It creates a BrowserWindow instance and loads the main application.
 * It also sets up the logging and database connections.
 *
 * @returns {Promise<void>} A Promise that resolves when all the setup is done.
 */
app.whenReady().then(async () => {
  await prepareNext("./frontend", 4444);

  await initLogs();

  startBackendServer()

  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

/* ++++++++++ events ++++++++++ */
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});



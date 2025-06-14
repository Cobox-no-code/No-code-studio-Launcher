import { exec } from "child_process";
import { app, BrowserWindow, ipcMain, shell } from "electron";
import { promises as fs } from "fs";
import { join } from "node:path";
import * as os from "os";
import backendProcess from "./app";
import { downloadAndUpdate } from "./downloadAndUpdate";
import { initLogs, isDev, prepareNext } from "./utils";

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
    win.setMenu(null);
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

// IPC handler for installing update
ipcMain.handle("install-update", async (event, fileName: string) => {
  try {
    console.log("📦 Installing update:", fileName);

    // Get the downloads path
    const downloadsPath = join(os.homedir(), "Downloads");
    const installerPath = join(downloadsPath, fileName);

    // Check if file exists
    try {
      await fs.access(installerPath);
      console.log("✅ Installer file found:", installerPath);
    } catch (error) {
      console.error("❌ Installer file not found:", installerPath);
      throw new Error(`Installer file not found: ${fileName}`);
    }

    // Method 1: Run installer with elevated privileges (Windows)
    if (process.platform === "win32") {
      return new Promise((resolve, reject) => {
        // Use PowerShell to run with admin privileges
        const command = `powershell -Command "Start-Process '${installerPath}' -Verb RunAs -Wait"`;

        exec(command, (error, stdout, stderr) => {
          if (error) {
            console.error("❌ Installation failed:", error);
            reject(new Error(`Installation failed: ${error.message}`));
            return;
          }

          console.log("✅ Installation completed successfully");
          console.log("stdout:", stdout);

          // After installation, quit the current app
          setTimeout(() => {
            app.quit();
          }, 2000);

          resolve({
            success: true,
            message: "Installation completed successfully",
          });
        });
      });
    }

    // Method 2: For other platforms or fallback
    else {
      // Use shell.openPath to open the installer
      const result = await shell.openPath(installerPath);

      if (result) {
        throw new Error(`Failed to open installer: ${result}`);
      }

      return { success: true, message: "Installer opened successfully" };
    }
  } catch (error: any) {
    console.error("❌ Install update error:", error);
    throw new Error(`Installation failed: ${error.message}`);
  }
});

// IPC handler for silent installation
ipcMain.handle("install-update-silent", async (event, fileName: string) => {
  try {
    console.log("📦 Silent installing update:", fileName);

    const downloadsPath = join(os.homedir(), "Downloads");
    const installerPath = join(downloadsPath, fileName);

    // Check if file exists
    await fs.access(installerPath);

    if (process.platform === "win32") {
      return new Promise((resolve, reject) => {
        // Silent installation for Windows
        const command = `"${installerPath}" /S /D="${process.execPath.replace(
          /[^\\]+$/,
          ""
        )}"`;

        exec(command, (error, stdout, stderr) => {
          if (error) {
            console.error("❌ Silent installation failed:", error);
            reject(new Error(`Silent installation failed: ${error.message}`));
            return;
          }

          console.log("✅ Silent installation completed");

          // Restart the application
          app.relaunch();
          app.quit();

          resolve({ success: true, message: "Silent installation completed" });
        });
      });
    } else {
      throw new Error("Silent installation not supported on this platform");
    }
  } catch (error: any) {
    console.error("❌ Silent install error:", error);
    throw new Error(`Silent installation failed: ${error.message}`);
  }
});

// IPC handler to quit app
ipcMain.handle("quit-app", () => {
  console.log("🚪 Quitting application...");
  app.quit();
});

// IPC handler to restart app
ipcMain.handle("restart-app", () => {
  console.log("🔄 Restarting application...");
  app.relaunch();
  app.quit();
});

// IPC handler to get app version
ipcMain.handle("get-app-version", () => {
  return app.getVersion();
});

// IPC handler to check if file exists
ipcMain.handle("check-file-exists", async (event, fileName: string) => {
  try {
    const downloadsPath = join(os.homedir(), "Downloads");
    const filePath = join(downloadsPath, fileName);

    await fs.access(filePath);
    return { exists: true, path: filePath };
  } catch (error) {
    return { exists: false, path: null };
  }
});

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

  startBackendServer();

  createWindow();
  downloadAndUpdate();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

/* ++++++++++ events ++++++++++ */
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

// Handle certificate errors (optional)
app.on(
  "certificate-error",
  (event, webContents, url, error, certificate, callback) => {
    if (isDev) {
      // In development, ignore certificate errors
      event.preventDefault();
      callback(true);
    } else {
      // In production, use default behavior
      callback(false);
    }
  }
);

export { createWindow };

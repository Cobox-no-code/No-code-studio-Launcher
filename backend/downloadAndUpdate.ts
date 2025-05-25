import { app } from "electron";
import { createWriteStream } from "fs";
import { join } from "path";
import https from "https";
import http from "http";
import { spawn } from "child_process";

const UPDATE_URL = "http://34.228.195.218/api/subscription/download-exe";
const FILE_NAME = "latest_app.exe";

export function downloadAndUpdate() {
  const filePath = join(app.getPath("temp"), FILE_NAME); // e.g., C:\Users\Leena\AppData\Local\Temp\latest_app.exe

  const file = createWriteStream(filePath);
  const request = UPDATE_URL.startsWith("https") ? https.get : http.get;

  request(UPDATE_URL, (response) => {
    if (response.statusCode !== 200) {
      console.error(
        `Failed to download update. Status: ${response.statusCode}`
      );
      return;
    }

    response.pipe(file);

    file.on("finish", () => {
      file.close();
      console.log("✅ Update downloaded:", filePath);

      // Launch the new app (optional)
      spawn(filePath, [], {
        detached: true,
        stdio: "ignore",
      }).unref();

      app.quit(); // Quit current app so new one runs
    });
  }).on("error", (err) => {
    console.error("❌ Download error:", err.message);
  });
}

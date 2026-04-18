import https from "https";
import { log } from "@main/utils/logger";

const VERSION_ENDPOINT = "https://api.cobox.games/api/game-version/1";

export function getServerVersion(): Promise<string | null> {
  return new Promise((resolve) => {
    https
      .get(VERSION_ENDPOINT, (res) => {
        let data = "";
        res.on("data", (c) => (data += c));
        res.on("end", () => {
          try {
            const parsed = JSON.parse(data);
            resolve(parsed?.version ?? null);
          } catch {
            resolve(null);
          }
        });
      })
      .on("error", (err) => {
        log.error("getServerVersion error:", err);
        resolve(null);
      });
  });
}

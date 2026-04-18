import { log } from "@main/utils/logger";
import type { ServerVersionData } from "@shared/types/game";
import https from "https";

const VERSION_ENDPOINT = "https://api.cobox.games/api/game-version/1";

export function getServerVersion(): Promise<ServerVersionData | null> {
  return new Promise((resolve) => {
    https
      .get(VERSION_ENDPOINT, (res) => {
        let data = "";
        res.on("data", (c) => (data += c));
        res.on("end", () => {
          try {
            const parsed = JSON.parse(data);
            if (!parsed || typeof parsed.version !== "string") {
              resolve(null);
              return;
            }
            resolve(parsed as ServerVersionData);
          } catch (err) {
            log.error("getServerVersion parse error:", err);
            resolve(null);
          }
        });
      })
      .on("error", (err) => {
        log.error("getServerVersion network error:", err);
        resolve(null);
      });
  });
}

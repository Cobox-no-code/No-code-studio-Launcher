// middlewares/syncCloudAfterChange.ts
import axios from "axios";
import { Request, Response, NextFunction } from "express";
import { db } from "../lib/db";
import { cloud_url } from "../urls.config";
// middlewares/syncCloudAfterChange.ts
export async function syncCloudAfterChangeFn(
  tableName: string,
  req: Request,
  res: Response
) {
  const firmId = req.headers["x-firm-id"] as string;
  if (!firmId) {
    console.log("No firm id");
    return;
  }
  const firm = await db("firms").where("id", firmId).first();
  try {
    let records =
      tableName === "firms"
        ? [await db("firms").where("id", firmId).first()]
        : await db(tableName, firmId).select();

    await axios.post(`${cloud_url}/sync/`, {
      table: tableName,
      records,
      owner: firm.owner,
    });
    console.log(`[${tableName}] Sync success for firm ${firmId}`);
  } catch (err: any) {
    console.error(`[${tableName}] Sync failed: ${err.message}`);
  }
}

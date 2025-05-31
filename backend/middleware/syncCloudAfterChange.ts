// middlewares/syncCloudAfterChange.ts
import axios from "axios";
import { Request, Response, NextFunction } from "express";
import { db } from "../lib/db";

export const syncCloudAfterChange = (tableName: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const { firmId, cloudUrl, owner, sync_enabled } = res.locals;

    if (!firmId || !owner || !cloudUrl || !sync_enabled) {
      return next(); // Skip sync if not available
    }

    try {
      let records =
        tableName === "firms"
          ? [await db("firms").where("id", firmId).first()]
          : await db(tableName, firmId).select();

      if (tableName === "parties") {
        records = records.map(({ additionalFields, ...rest }) => rest);
      }

      await axios.post(`${cloudUrl}/sync/`, {
        table: tableName,
        records,
        owner,
      });

      console.log(`[${tableName}] Sync success for firm ${firmId}`);
    } catch (err: any) {
      console.error(`[${tableName}] Sync failed: ${err.message}`);
    }

    next();
  };
};

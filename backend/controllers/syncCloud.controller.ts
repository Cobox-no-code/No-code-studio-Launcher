import { Request, Response } from "express";
import axios from "axios";
import { db } from "../lib/db";
import { cloudUrl } from "../urls.config";

const SYNC_TABLES = [
  "firms",
  "categories",
  "units",
  "unit_conversions",
  "items",
  "groups",
  "parties",
  "party_additional_fields",
  "documents",
  "document_items",
  "document_charges",
  "document_transportation",
  "document_relationships",
  "stock_movements",
  "bank_accounts",
  "bank_transactions",
  "payments",
];

interface SyncRequestBody {
  cloudUrl: string;
  firmId: string;
  owner: string;
}

interface SyncResult {
  table: string;
  status: "success" | "skipped" | "failed";
  created?: number;
  updated?: number;
  reason?: string;
  error?: string;
}

// 🔄 Sync Local ➝ Cloud
export const syncToCloud = async (
  req: Request,
  res: Response
): Promise<any> => {
  const {  firmId }: SyncRequestBody = req.body;

  if (!cloudUrl || !firmId) {
    return res.status(400).json({ error: "cloudUrl and firmId are required." });
  }

  const results: SyncResult[] = [];

  for (const table of SYNC_TABLES) {
    try {
      const records =
        table === "firms"
          ? await db(table).select()
          : await db(table, firmId).select();

      // POST to /sync/push on cloud
      const response = await axios.post(`${cloudUrl}/sync/push?firmId=${firmId}`, {
        [table]: records,
      });

      results.push({
        table,
        status: "success",
        created: response.data.created || records.length,
        updated: response.data.updated || 0,
      });
    } catch (error: any) {
      results.push({
        table,
        status: "failed",
        error: error?.message || "Unknown error",
      });
    }
  }

  return res.json({
    status: "completed",
    firmId,
    results,
  });
};

// 🔄 Sync Cloud ➝ Local
export const syncToLocal = async (
  req: Request,
  res: Response
): Promise<any> => {
  const { firmId }: SyncRequestBody = req.body;

  if (!cloudUrl || !firmId) {
    return res.status(400).json({ error: "cloudUrl and firmId are required." });
  }

  const results: SyncResult[] = [];

  try {
    const response = await axios.post(`${cloudUrl}/sync/pull?firmId=${firmId}`);
    const pulledData = response.data;

    for (const table of SYNC_TABLES) {
      const records = pulledData[table];
      if (!records || records.length === 0) {
        results.push({ table, status: "skipped", reason: "no records fetched" });
        continue;
      }

      for (const record of records) {
        const exists = await db(table).where("id", record.id).first();
        if (exists) {
          await db(table).where("id", record.id).update(record);
        } else {
          await db(table).insert(record);
        }
      }

      results.push({ table, status: "success", created: records.length });
    }

    return res.json({ status: "completed", firmId, results });
  } catch (err: any) {
    return res.status(500).json({
      error: "Sync failed",
      message: err?.message || err,
    });
  }
};

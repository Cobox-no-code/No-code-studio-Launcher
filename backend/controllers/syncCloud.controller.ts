import { Request, Response } from "express";
import axios from "axios";
import { db } from "../lib/db";

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

export const syncToCloud = async (
  req: Request,
  res: Response
): Promise<any> => {
  const { cloudUrl, firmId, owner }: SyncRequestBody = req.body;

  if (!cloudUrl || !firmId) {
    return res.status(400).json({ error: "cloudUrl and firmId are required." });
  }

  const results: SyncResult[] = [];

  for (const table of SYNC_TABLES) {
    try {
      let records =
        table === "firms"
          ? await db(table).select()
          : await db(table, firmId).select();

      if (records.length === 0) {
        results.push({
          table,
          status: "skipped",
          reason: "no records to sync",
        });
        continue;
      }

      const response = await axios.post(`${cloudUrl}/sync/`, {
        table,
        records,
        owner,
      });

      results.push({
        table,
        status: "success",
        created: response.data.created || 0,
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

export const syncToLocal = async (
  req: Request,
  res: Response
): Promise<any> => {
  const { cloudUrl, firmId, owner }: SyncRequestBody = req.body;

  if (!cloudUrl || !firmId) {
    return res.status(400).json({ error: "cloudUrl and firmId are required." });
  }

  const results: SyncResult[] = [];

  for (const table of SYNC_TABLES) {
    try {
      const url = `${cloudUrl}/fetch/?table=${table}&owner=${owner}${
        table !== "firms" ? `&firmId=${firmId}` : ""
      }`;
      const response = await axios.get(url);
      const records = response.data.records;
      if (table === "parties") {
        console.log(records);
        console.log(response);
      }

      if (!records || records.length === 0) {
        results.push({
          table,
          status: "skipped",
          reason: "no records fetched",
        });
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

      results.push({
        table,
        status: "success",
        created: records.length,
      });
    } catch (error: any) {
      results.push({
        table,
        status: "failed",
        error: error || "Unknown error",
      });
    }
  }

  return res.json({
    status: "completed",
    firmId,
    results,
  });
};

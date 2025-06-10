// middlewares/syncCloudAfterChange.ts
import axios from "axios";
import { Request, Response, NextFunction } from "express";
import { db } from "../lib/db";
import { cloud_url } from "../urls.config";

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
  if (!firm) {
    console.log("Firm not found");
    return;
  }

  // Handle related tables for documents and parties
  let tablesToSync: string[] = [];

  if (tableName === "documents") {
    tablesToSync = [
      "documents",
      "document_items",
      "document_charges",
      "document_transportation",
      "document_relationships",
      "stock_movements",
      "parties",
      "items"
    ];
  }
  else if( tableName === "payments" ){
     tablesToSync = [
      "payments",
      "bank_transactions",
      "bank_accounts",
      "parties",
      "items"
    ];

  } else if (tableName === "parties") {
    tablesToSync = ["parties", "party_additional_fields"];
  } else {
    tablesToSync = [tableName];
  }

  for (const table of tablesToSync) {
    try {
      const records =
        table === "firms"
          ? [await db("firms").where("id", firmId).first()]
          : await db(table, firmId).select();

      await axios.post(`${cloud_url}/sync/`, {
        table,
        records,
        owner: firm.owner,
      });

      console.log(`[${table}] Sync success for firm ${firmId}`);
    } catch (err: any) {
      console.error(`[${table}] Sync failed: ${err.message}`);
    }
  }
}

import { getApiBaseUrl() } from "@/redux/api/api.config";
import axios from "axios";

interface SyncResponse {
  status: "completed";
  firmId: string;
  results: {
    table: string;
    status: "success" | "skipped" | "failed";
    created?: number;
    updated?: number;
    reason?: string;
    error?: string;
  }[];
}

export async function syncAllToCloud(
  cloudUrl: string,
  firmId: string,
  owner: string
) {
  if (!cloudUrl || !firmId) {
    console.warn("Missing cloudUrl or firmId.");
    return;
  }

  try {
    const response = await axios.post<SyncResponse>(
      `${getApiBaseUrl()}/sync-cloud/all`,
      {
        cloudUrl,
        firmId,
        owner,
      }
    );

    const data = response.data;
    console.log(`✅ Sync completed for firm ${data.firmId}`);

    for (const result of data.results) {
      if (result.status === "success") {
        console.log(
          `✅ ${result.table}: Created ${result.created}, Updated ${result.updated}`
        );
      } else if (result.status === "skipped") {
        console.log(`⚠️  ${result.table}: Skipped (${result.reason})`);
      } else {
        console.error(`❌ ${result.table}: ${result.error}`);
      }
    }

    return data;
  } catch (err: any) {
    console.error("❌ Failed to sync:", err.message);
    throw err;
  }
}

export async function syncAllToLocal(
  cloudUrl: string,
  firmId: string,
  owner: string
) {
  if (!cloudUrl || !firmId) {
    console.warn("Missing cloudUrl or firmId.");
    return;
  }

  try {
    const response = await axios.post<SyncResponse>(
      `${getApiBaseUrl()}/sync-local/all`,
      {
        cloudUrl,
        firmId,
        owner,
      }
    );

    const data = response.data;
    console.log(`✅ Sync completed for firm ${data.firmId}`);

    for (const result of data.results) {
      if (result.status === "success") {
        console.log(
          `✅ ${result.table}: Created ${result.created}, Updated ${result.updated}`
        );
      } else if (result.status === "skipped") {
        console.log(`⚠️  ${result.table}: Skipped (${result.reason})`);
      } else {
        console.error(`❌ ${result.table}: ${result.error}`);
      }
    }

    return data;
  } catch (err: any) {
    console.error("❌ Failed to sync:", err.message);
    throw err;
  }
}

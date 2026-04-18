import axios, { AxiosInstance } from "axios";
import { BACKEND_URL } from "@main/utils/env";

/**
 * Shared axios instance for main-process HTTP calls.
 * Renderer talks to backend directly via its own fetch; this is for
 * operations that must stay in main (internal keys, streams, file writes).
 */
export const http: AxiosInstance = axios.create({
  baseURL: BACKEND_URL,
  timeout: 30_000,
});

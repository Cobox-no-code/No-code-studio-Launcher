import type { CoboxAPI } from "../shared/types/cobox-api";

declare global {
  interface Window {
    cobox: CoboxAPI;
  }
}

export {};

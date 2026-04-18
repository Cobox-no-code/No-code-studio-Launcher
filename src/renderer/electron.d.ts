import type { CoboxAPI } from "../preload";

declare global {
  interface Window {
    cobox: CoboxAPI;
  }
}

export {};

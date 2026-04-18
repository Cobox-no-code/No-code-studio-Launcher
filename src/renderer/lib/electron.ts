import type { CoboxAPI } from "../../shared/types/cobox-api";

/**
 * Typed handle on `window.cobox`. Importing from here (instead of reading
 * `window.cobox` directly) keeps the door open for easy mocking later.
 */
export const cobox: CoboxAPI = window.cobox;

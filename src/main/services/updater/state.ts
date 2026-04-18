import type { UpdateStatePayload } from "@shared/types/update";

/**
 * Authoritative update state — owned entirely by main process.
 * Renderer reads via invoke(getState) + subscribes to push events.
 * Never mutated by renderer.
 */
class UpdaterState {
  private _state: UpdateStatePayload = {
    status: "idle",
    version: null,
    percent: 0,
    error: null,
  };

  private _availableConfirmed = false;

  get snapshot(): UpdateStatePayload {
    return { ...this._state };
  }

  get availableConfirmed(): boolean {
    return this._availableConfirmed;
  }

  set(next: Partial<UpdateStatePayload>): UpdateStatePayload {
    this._state = { ...this._state, ...next };
    return this.snapshot;
  }

  setAvailableConfirmed(value: boolean): void {
    this._availableConfirmed = value;
  }

  reset(): void {
    this._state = { status: "idle", version: null, percent: 0, error: null };
    this._availableConfirmed = false;
  }
}

export const updaterState = new UpdaterState();

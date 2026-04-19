import type { BootstrapState } from "@shared/types/bootstrap";

class BootstrapStateContainer {
  private _state: BootstrapState = {
    phase: "initializing",
    firstRun: false,
    introCompleted: false,
    launcherUpdate: { available: false, version: null, percent: 0 },
    gameDownload: {
      status: "idle",
      currentVersion: null,
      targetVersion: null,
      percent: 0,
      error: null,
    },
    error: null,
  };

  get snapshot(): BootstrapState {
    return {
      ...this._state,
      launcherUpdate: { ...this._state.launcherUpdate },
      gameDownload: { ...this._state.gameDownload },
    };
  }

  set(patch: Partial<BootstrapState>): BootstrapState {
    this._state = { ...this._state, ...patch };
    return this.snapshot;
  }

  patchGameDownload(
    patch: Partial<BootstrapState["gameDownload"]>,
  ): BootstrapState {
    this._state = {
      ...this._state,
      gameDownload: { ...this._state.gameDownload, ...patch },
    };
    return this.snapshot;
  }

  patchLauncherUpdate(
    patch: Partial<BootstrapState["launcherUpdate"]>,
  ): BootstrapState {
    this._state = {
      ...this._state,
      launcherUpdate: { ...this._state.launcherUpdate, ...patch },
    };
    return this.snapshot;
  }
}

export const bootstrapState = new BootstrapStateContainer();

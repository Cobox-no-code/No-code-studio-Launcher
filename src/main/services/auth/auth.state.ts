import type { AuthState, AuthUser } from "@shared/types/auth";

class AuthStateContainer {
  private _state: AuthState = {
    status: "signed-out",
    user: null,
    tokenId: null,
    error: null,
  };

  get snapshot(): AuthState {
    return { ...this._state };
  }

  set(next: Partial<AuthState>): AuthState {
    this._state = { ...this._state, ...next };
    return this.snapshot;
  }

  setSignedIn(user: AuthUser): AuthState {
    return this.set({
      status: "signed-in",
      user,
      tokenId: null,
      error: null,
    });
  }

  setSignedOut(): AuthState {
    return this.set({
      status: "signed-out",
      user: null,
      tokenId: null,
      error: null,
    });
  }

  setError(msg: string): AuthState {
    return this.set({ status: "error", error: msg });
  }
  getCurrentSession(): { user: AuthUser; accessToken: string } | null {
    if (
      this._state.status !== "signed-in" ||
      !this._state.user ||
      !this._state.tokenId
    )
      return null;
    return { user: this._state.user, accessToken: this._state.tokenId };
  }
}

export const authState = new AuthStateContainer();

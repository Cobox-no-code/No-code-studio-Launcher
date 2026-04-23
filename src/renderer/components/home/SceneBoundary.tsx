import { Component, type ReactNode } from "react";

interface State {
  failed: boolean;
}

/**
 * If three.js / WebGL fails (older GPU, Electron flag mismatch, etc.)
 * render nothing instead of crashing the whole page.
 */
export class SceneBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  componentDidCatch(err: unknown) {
    console.warn("[CreatorHomeScene] three.js failed:", err);
  }

  render() {
    if (this.state.failed) return null;
    return this.props.children;
  }
}

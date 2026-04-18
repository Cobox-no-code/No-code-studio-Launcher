import { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import type { UpdateStatePayload } from "../shared/types/update";
import "./electron.d";

function App() {
  const [state, setState] = useState<UpdateStatePayload | null>(null);
  const [checking, setChecking] = useState(false);

  // Polling + push hybrid — same pattern as before
  useEffect(() => {
    let mounted = true;

    const pull = async () => {
      const s = await window.cobox.updater.getState();
      if (mounted) setState(s);
    };

    pull();
    const interval = setInterval(pull, 800);
    const unsubscribe = window.cobox.updater.onStateChanged((s) => {
      if (mounted) setState(s);
    });

    return () => {
      mounted = false;
      clearInterval(interval);
      unsubscribe();
    };
  }, []);

  return (
    <div style={{ padding: 40, fontFamily: "ui-sans-serif, sans-serif" }}>
      <h1>Cobox Launcher v2.0 — Updater Test</h1>
      <pre
        style={{
          background: "#f3f4f6",
          padding: 16,
          borderRadius: 8,
          fontSize: 13,
        }}
      >
        {JSON.stringify(state, null, 2)}
      </pre>
      <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
        <button
          disabled={checking}
          onClick={async () => {
            setChecking(true);
            const r = await window.cobox.updater.check();
            console.log("check result:", r);
            setChecking(false);
          }}
        >
          {checking ? "Checking..." : "Check for updates"}
        </button>
        <button
          disabled={state?.status !== "available"}
          onClick={() => window.cobox.updater.download()}
        >
          Download
        </button>
        <button
          disabled={state?.status !== "downloaded"}
          onClick={() => window.cobox.updater.install()}
        >
          Install & Restart
        </button>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(<App />);

import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import type {
  GameStatus,
  LocalLibraryGame,
  ServerVersionData,
} from "../shared/types/game";
import type { UpdateStatePayload } from "../shared/types/update";
import "./electron.d";

function App() {
  const [updateState, setUpdateState] = useState<UpdateStatePayload | null>(
    null,
  );
  const [gameStatus, setGameStatus] = useState<GameStatus | null>(null);
  const [serverVersion, setServerVersion] = useState<ServerVersionData | null>(
    null,
  );
  const [defaultPath, setDefaultPath] = useState<string>("");
  const [dlProgress, setDlProgress] = useState<number>(0);
  const [library, setLibrary] = useState<LocalLibraryGame[]>([]);

  useEffect(() => {
    let mounted = true;

    const pullUpdater = async () => {
      const s = await window.cobox.updater.getState();
      if (mounted) setUpdateState(s);
    };
    const pullGame = async () => {
      const s = await window.cobox.games.getStatus();
      if (mounted) setGameStatus(s);
    };

    pullUpdater();
    pullGame();
    window.cobox.games
      .getDefaultInstallPath()
      .then((p) => mounted && setDefaultPath(p));
    window.cobox.games.getLocalLibrary().then((l) => mounted && setLibrary(l));

    const interval = setInterval(() => {
      pullUpdater();
      pullGame();
    }, 1000);

    const unsubUpdater = window.cobox.updater.onStateChanged((s) => {
      if (mounted) setUpdateState(s);
    });
    const unsubDl = window.cobox.games.onDownloadProgress((p) => {
      if (mounted) setDlProgress(p);
    });

    return () => {
      mounted = false;
      clearInterval(interval);
      unsubUpdater();
      unsubDl();
    };
  }, []);

  const block: React.CSSProperties = {
    background: "#f3f4f6",
    padding: 12,
    borderRadius: 6,
    fontSize: 12,
    fontFamily: "ui-monospace, monospace",
    marginTop: 8,
  };

  return (
    <div
      style={{
        padding: 32,
        fontFamily: "ui-sans-serif, sans-serif",
        maxWidth: 900,
      }}
    >
      <h1 style={{ marginBottom: 4 }}>
        Cobox Launcher v2.0 — IPC Test Harness
      </h1>
      <p style={{ color: "#6b7280", marginTop: 0 }}>
        Updater + Games services wired through the new layered architecture.
      </p>

      <section style={{ marginTop: 24 }}>
        <h3>Updater</h3>
        <pre style={block}>{JSON.stringify(updateState, null, 2)}</pre>
        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <button onClick={() => window.cobox.updater.check()}>Check</button>
          <button
            disabled={updateState?.status !== "available"}
            onClick={() => window.cobox.updater.download()}
          >
            Download
          </button>
          <button
            disabled={updateState?.status !== "downloaded"}
            onClick={() => window.cobox.updater.install()}
          >
            Install
          </button>
        </div>
      </section>

      <section style={{ marginTop: 32 }}>
        <h3>Games — status</h3>
        <pre style={block}>{JSON.stringify(gameStatus, null, 2)}</pre>
        <div
          style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}
        >
          <button
            onClick={async () =>
              setServerVersion(await window.cobox.games.getServerVersion())
            }
          >
            Get server version
          </button>
          <button
            disabled={!gameStatus?.installed}
            onClick={async () => {
              const r = await window.cobox.games.launch();
              console.log("launch:", r);
            }}
          >
            Launch game
          </button>
          <button
            onClick={async () => {
              const p = await window.cobox.games.chooseInstallPath();
              console.log("chosen:", p);
            }}
          >
            Choose install dir
          </button>
        </div>
        <div style={{ marginTop: 8, fontSize: 13 }}>
          Server version:{" "}
          <code>
            {serverVersion
              ? `${serverVersion.version} (${serverVersion.link})`
              : "not fetched"}
          </code>
          <br />
          Default install path: <code>{defaultPath}</code>
          <br />
          Last download progress: <code>{dlProgress.toFixed(1)}%</code>
        </div>
      </section>

      <section style={{ marginTop: 32 }}>
        <h3>Live games — local library ({library.length})</h3>
        <pre style={block}>{JSON.stringify(library.slice(0, 3), null, 2)}</pre>
        <button
          onClick={async () =>
            setLibrary(await window.cobox.games.getLocalLibrary())
          }
        >
          Refresh
        </button>
      </section>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(<App />);

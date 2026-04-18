import React from "react";
import ReactDOM from "react-dom/client";

function App() {
  return (
    <div style={{ padding: 40, fontFamily: "sans-serif" }}>
      <h1>Cobox Launcher v2.0</h1>
      <p>Migration bootstrap successful.</p>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(<App />);

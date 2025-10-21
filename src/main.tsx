import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { applyPlatformClass } from "./lib/tauri/detectPlatform";
// import AppTest from "./App-Test";
// Note: NMRium v1.6.1 doesn't require separate CSS import
// Styles are bundled within the component

// Detect and apply platform-specific styles for desktop mode
applyPlatformClass();

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

// DIAGNOSTIC: If white screen, uncomment AppTest above and use:
// <AppTest />
// to test if React itself works

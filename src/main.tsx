import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

// Blueprint.js CSS - REQUIRED for NMRium to render correctly
import '@blueprintjs/core/lib/css/blueprint.css';
import '@blueprintjs/icons/lib/css/blueprint-icons.css';
import '@blueprintjs/select/lib/css/blueprint-select.css';

import "./index.css";
import { applyPlatformClass } from "./lib/tauri/detectPlatform";

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

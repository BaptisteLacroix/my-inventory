import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { InventoryProvider } from "./state/InventoryContext";
import "./styles/tokens.css";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <InventoryProvider>
      <App />
    </InventoryProvider>
  </React.StrictMode>,
);

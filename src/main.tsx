import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { InventoryProvider } from "./state/InventoryContext";
import { TourProvider } from "./state/TourContext";
import "./styles/tokens.css";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <InventoryProvider>
      <TourProvider>
        <App />
      </TourProvider>
    </InventoryProvider>
  </React.StrictMode>,
);

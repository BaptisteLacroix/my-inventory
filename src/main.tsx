import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { InventoryProvider } from "./state/InventoryContext";
import { TourProvider } from "./state/TourContext";
import { WikiProvider } from "./state/WikiContext";
import "./styles/tokens.css";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <InventoryProvider>
      <TourProvider>
        <WikiProvider>
          <App />
        </WikiProvider>
      </TourProvider>
    </InventoryProvider>
  </React.StrictMode>,
);

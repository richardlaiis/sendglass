import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./i18n";
import "./styles/tokens.css";
import "./styles/global.css";
import { App } from "./app/App";
import { SettingsProvider } from "./app/SettingsProvider";
import { StorageContext } from "./storage/StorageContext";
import { createDexieRepositories } from "./storage/dexie";

const repositories = createDexieRepositories();

const root = document.getElementById("root");
if (!root) throw new Error("#root not found");

createRoot(root).render(
  <StrictMode>
    <StorageContext value={repositories}>
      <SettingsProvider>
        <App />
      </SettingsProvider>
    </StorageContext>
  </StrictMode>,
);

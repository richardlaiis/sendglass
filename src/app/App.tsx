import { CapsulePage } from "../features/capsule/CapsulePage";
import { HistoryPage } from "../features/history/HistoryPage";
import { HomePage } from "../features/home/HomePage";
import { SettingsPage } from "../features/settings/SettingsPage";
import { WritePage } from "../features/write/WritePage";
import { useRoute } from "./router";

export function App() {
  const route = useRoute();
  switch (route.name) {
    case "home":
      return <HomePage />;
    case "new":
      return <WritePage />;
    case "settings":
      return <SettingsPage />;
    case "history":
      return <HistoryPage />;
    case "capsule":
      // key: a fresh page (and fresh chain state) per capsule.
      return <CapsulePage key={route.id} id={route.id} />;
  }
}

import { HomePage } from "../features/home/HomePage";
import { PlaceholderPage } from "../features/PlaceholderPage";
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
    case "capsule":
    case "history":
      return <PlaceholderPage />;
  }
}

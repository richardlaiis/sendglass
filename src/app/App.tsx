import { lazy, Suspense } from "react";
import { CapsulePage } from "../features/capsule/CapsulePage";
import { HistoryPage } from "../features/history/HistoryPage";
import { HomePage } from "../features/home/HomePage";
import { SettingsPage } from "../features/settings/SettingsPage";
import { WritePage } from "../features/write/WritePage";
import { useNotificationScheduler } from "../notifications/useNotificationScheduler";
import { useRoute } from "./router";

// Dev-only playground. `import.meta.env.DEV` is false in production builds, so this is dropped.
const DevHourglassPage = import.meta.env.DEV
  ? lazy(() => import("../features/dev/DevHourglassPage"))
  : null;

export function App() {
  const route = useRoute();
  useNotificationScheduler();
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
    case "dev-hourglass":
      return DevHourglassPage ? (
        <Suspense fallback={null}>
          <DevHourglassPage />
        </Suspense>
      ) : (
        <HomePage />
      );
  }
}

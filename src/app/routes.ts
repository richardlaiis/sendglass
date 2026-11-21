export type Route =
  | { name: "home" }
  | { name: "new" }
  | { name: "capsule"; id: string }
  | { name: "history" }
  | { name: "settings" }
  /** Dev-only playground; App renders it only in `npm run dev`. */
  | { name: "dev-hourglass" };

/** Parses `location.hash` (e.g. "#/capsule/abc"). Unknown routes fall back to home. */
export function parseHash(hash: string): Route {
  const path = hash.replace(/^#/, "").replace(/\/+$/, "") || "/";
  if (path === "/" || path === "") return { name: "home" };
  if (path === "/new") return { name: "new" };
  if (path === "/history") return { name: "history" };
  if (path === "/settings") return { name: "settings" };
  if (path === "/dev/hourglass") return { name: "dev-hourglass" };
  const m = /^\/capsule\/([^/]+)$/.exec(path);
  if (m?.[1]) return { name: "capsule", id: decodeURIComponent(m[1]) };
  return { name: "home" };
}

export function routeToHash(route: Route): string {
  switch (route.name) {
    case "home":
      return "#/";
    case "new":
      return "#/new";
    case "history":
      return "#/history";
    case "settings":
      return "#/settings";
    case "capsule":
      return `#/capsule/${encodeURIComponent(route.id)}`;
    case "dev-hourglass":
      return "#/dev/hourglass";
  }
}

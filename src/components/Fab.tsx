import type { ReactNode } from "react";

interface FabProps {
  href: string;
  icon: ReactNode;
  label: string;
}

/** Extended floating action button. */
export function Fab({ href, icon, label }: FabProps) {
  return (
    <a className="fab" href={href}>
      {icon}
      <span>{label}</span>
    </a>
  );
}

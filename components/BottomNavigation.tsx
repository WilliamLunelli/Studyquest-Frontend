"use client";

import Link from "next/link";
import { Home, CalendarDays, ChartNoAxesCombined, Settings } from "lucide-react";
import { usePathname } from "next/navigation";

type NavItem = {
  href: "/dashboard" | "/cycle" | "/dashboard/analytics" | "/settings";
  icon: React.ReactNode;
  label: string;
};

const items: NavItem[] = [
  { href: "/dashboard", icon: <Home size={23} />, label: "Home" },
  { href: "/cycle", icon: <CalendarDays size={23} />, label: "Ciclo" },
  { href: "/dashboard/analytics", icon: <ChartNoAxesCombined size={23} />, label: "Dados" },
  { href: "/settings", icon: <Settings size={23} />, label: "Ajustes" },
];

export function BottomNavigation() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 flex min-h-20 items-center justify-center gap-2 border-t border-border bg-surface/95 px-3 pb-[env(safe-area-inset-bottom)] backdrop-blur sm:gap-8"
      aria-label="Navegação principal"
    >
      {items.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            className={`flex min-h-16 w-20 flex-col items-center justify-center gap-1 transition ${
              isActive ? "text-accent" : "text-muted"
            }`}
          >
            {item.icon}
            <span className="text-sm">{isActive ? <strong>{item.label}</strong> : item.label}</span>
            {isActive && <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-accent" />}
          </Link>
        );
      })}
    </nav>
  );
}

import Image from "next/image";
import { SidebarItem } from "./SidebarItem";

interface SidebarProps {
  menuMain: Array<{ label: string; href?: string }>;
  menuProfile: string[];
  activeIndex?: number;
}

export function Sidebar({ menuMain, menuProfile, activeIndex = 0 }: SidebarProps) {
  const mobileItems = menuMain.filter((item) => item.href).slice(0, 2);

  return (
    <>
      <aside className="hidden rounded-3xl bg-[#f9f9f9] px-4 py-5 sm:px-5 sm:py-6 lg:block">
      <div className="flex items-center gap-3 rounded-2xl bg-white px-4 py-4 shadow-sm ring-1 ring-black/5 sm:py-5">
        <p className="font-display text-xl font-semibold leading-[1.05] sm:text-2xl">
          Study
          <br />
          Quest
        </p>
      </div>

      <div className="mt-8 space-y-1">
        {menuMain.map((item, index) => (
          <SidebarItem key={item.label} label={item.label} href={item.href} active={index === activeIndex} />
        ))}
      </div>

      <p className="mt-8 px-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Profile</p>
      <div className="mt-3 space-y-1">
        {menuProfile.map((item) => (
          <SidebarItem key={item} label={item} />
        ))}
      </div>

      <div className="mt-8 flex items-center justify-between rounded-xl bg-white px-3 py-2.5 text-sm text-slate-500 ring-1 ring-black/5 sm:mt-10">
        <span>Modo escuro</span>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs">OFF</span>
      </div>
      </aside>

      <nav
        aria-label="Navegação principal"
        className="fixed inset-x-0 bottom-0 z-40 flex min-h-16 items-stretch justify-around border-t border-slate-200/80 bg-white/95 px-2 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_24px_rgba(15,23,42,0.08)] backdrop-blur lg:hidden"
      >
        {mobileItems.map((item, index) => (
          <SidebarItem
            key={item.label}
            label={index === 0 ? "Início" : item.label}
            href={item.href}
            active={index === activeIndex}
            mobile
          />
        ))}
        <SidebarItem label="Perfil" mobile />
      </nav>
    </>
  );
}

import Image from "next/image";
import { SidebarItem } from "./SidebarItem";

interface SidebarProps {
  menuMain: Array<{ label: string; href?: string }>;
  menuProfile: string[];
  activeIndex?: number;
}

export function Sidebar({ menuMain, menuProfile, activeIndex = 0 }: SidebarProps) {
  return (
    <aside className="rounded-3xl bg-[#f9f9f9] px-4 py-5 sm:px-5 sm:py-6">
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
  );
}

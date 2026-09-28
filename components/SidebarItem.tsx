import {
  BookOpen,
  CalendarDays,
  Home,
  Settings,
  Star,
  Trophy,
  UserCircle,
  type LucideIcon,
} from "lucide-react";

interface SidebarItemProps {
  label: string;
  active?: boolean;
  href?: string;
  mobile?: boolean;
}

export function SidebarItem({ label, active, href, mobile = false }: SidebarItemProps) {
  const iconByLabel: Record<string, LucideIcon> = {
    "Menu Principal": Home,
    Início: Home,
    Matérias: BookOpen,
    Calendário: CalendarDays,
    Perfil: UserCircle,
    "Sua experiência": Trophy,
    "Matérias favoritas": Star,
    Configurações: Settings,
  };
  const Icon = iconByLabel[label] ?? UserCircle;
  const className = `${mobile ? "flex min-h-16 min-w-20 flex-1 flex-col justify-center gap-1 px-2 text-center text-xs" : "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm"} transition ${
    active
      ? "bg-[#974FC9]/10 font-semibold text-[#974FC9]"
      : "text-slate-500 hover:bg-slate-100 hover:text-slate-700"
  }`;

  if (href) {
    return (
      <a href={href} className={className}>
        <Icon aria-hidden="true" size={mobile ? 20 : 18} strokeWidth={active ? 2.25 : 1.8} />
        <span>{label}</span>
      </a>
    );
  }

  return (
    <button type="button" className={className}>
      <Icon aria-hidden="true" size={mobile ? 20 : 18} strokeWidth={active ? 2.25 : 1.8} />
      <span>{label}</span>
    </button>
  );
}

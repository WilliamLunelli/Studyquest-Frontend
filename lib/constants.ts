export const menuMain = [
  { label: "Menu Principal", href: "/dashboard" },
  { label: "Matérias", href: "/subjects" },
  { label: "Calendário" },
];

export const menuProfile = ["Sua experiência", "Matérias favoritas", "Configurações"];

export const goals = [
  {
    text: "Quais são as diferenças dos três estágios do modernismo?",
    xp: "100XP - Literatura",
  },
  {
    text: "Concluir uma redação dissertativa-argumentativa",
    xp: "100XP - Produção de texto",
  },
];

export const pending = [
  {
    title: "Literatura",
    meta: "1 tópico registrado",
    duration: "00:02:03",
    gradient: "from-[#ece4d8] via-[#f6efe3] to-[#d8c7ad]",
  },
  {
    title: "Produção de texto",
    meta: "1 tópico registrado",
    duration: "00:03:07",
    gradient: "from-[#d6cec4] via-[#e8ddd1] to-[#bba692]",
  },
];

export const ranking = [
  { name: "Andre Carvalho", user: "@andrexvc" },
  { name: "William Lunelli", user: "@williansnelli" },
  { name: "Ana Gabriele", user: "@obliviox" },
  { name: "Guilherme Barbosa", user: "@mestrexvc" },
];

export interface SubjectCardData {
  title: string;
  meta: string;
  duration: string;
  gradient: string;
  areaName?: string;
}

export const subjects: SubjectCardData[] = [
  {
    title: "Literatura",
    meta: "1 tópico registrado",
    duration: "00:02:03",
    gradient: "from-[#e7dfd0] via-[#f4ecde] to-[#d4c19e]",
  },
  {
    title: "Produção de texto",
    meta: "1 tópico registrado",
    duration: "00:03:07",
    gradient: "from-[#dbd4c9] via-[#ebe1d5] to-[#bca891]",
  },
];

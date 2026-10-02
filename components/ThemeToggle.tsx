"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

type Theme = "light" | "dark";

const STORAGE_KEY = "studyquest_theme";

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.classList.add("theme-switching");
  root.classList.toggle("dark", theme === "dark");
  root.style.colorScheme = theme;
  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(() => root.classList.remove("theme-switching"));
  });
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    const storedTheme = window.localStorage.getItem(STORAGE_KEY) as Theme | null;
    const preferredTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    const nextTheme = storedTheme === "dark" || storedTheme === "light" ? storedTheme : preferredTheme;

    setTheme(nextTheme);
    applyTheme(nextTheme);
  }, []);

  function toggleTheme() {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    window.localStorage.setItem(STORAGE_KEY, nextTheme);
    applyTheme(nextTheme);
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={theme === "dark" ? "Ativar tema claro" : "Ativar tema escuro"}
      aria-pressed={theme === "dark"}
      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-border bg-surface px-4 text-sm font-medium text-muted transition hover:border-accent hover:text-accent"
    >
      {theme === "dark" ? <Sun aria-hidden="true" size={17} /> : <Moon aria-hidden="true" size={17} />}
      <span>{theme === "dark" ? "Claro" : "Escuro"}</span>
    </button>
  );
}
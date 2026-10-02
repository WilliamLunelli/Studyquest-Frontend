import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

interface AuthShellProps {
  eyebrow: string;
  title: string;
  description: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  backHref?: "/login" | "/register" | "/forgot-password" | "/reset-password";
}

export function AuthShell({ eyebrow, title, description, children, footer, backHref }: AuthShellProps) {
  return (
    <main className="min-h-dvh w-full bg-page text-foreground">
      <div className="grid min-h-dvh w-full overflow-hidden bg-page lg:grid-cols-[1fr_1fr]">
        <section className="relative flex min-h-dvh items-center justify-center overflow-hidden px-5 py-7 pb-[410px] sm:px-10 sm:py-12 sm:pb-[430px] lg:pb-12">
          <div className="relative z-10 w-full max-w-md">
            <div className="mb-7 flex items-center justify-between">
              <Link href="/login" className="font-display text-xl font-semibold leading-none text-foreground">
                Study
                <br />
                Quest
              </Link>
              <ThemeToggle />
            </div>

            {backHref ? (
              <Link href={backHref} className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-muted transition hover:text-accent">
                <ArrowLeft aria-hidden="true" size={17} /> Voltar
              </Link>
            ) : null}

            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">{eyebrow}</p>
            <h1 className="mt-3 font-display text-3xl font-semibold leading-tight text-foreground sm:text-[36px]">{title}</h1>
            <div className="mt-4 text-base leading-7 text-muted sm:text-[18px]">{description}</div>

            <div className="mt-8 sm:mt-10">{children}</div>
            {footer ? <div className="mt-7 text-center text-sm text-slate-500">{footer}</div> : null}
          </div>

          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[410px] lg:hidden">
            <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_0%,#f2ae8f_24%,#ee65b2_62%,#974fc9_100%)] dark:bg-[linear-gradient(180deg,transparent_0%,#5c382d_24%,#a33f70_62%,#5b2b78_100%)]" />
            <Image
              src="/images/auth/charathers.png"
              alt="Personagens do StudyQuest"
              width={340}
              height={250}
              priority
              className="absolute bottom-[112px] left-1/2 h-[250px] w-[340px] max-w-none -translate-x-1/2 object-contain"
            />
            <h2 className="absolute bottom-7 left-5 right-5 text-center font-display text-2xl font-semibold leading-tight text-white sm:text-3xl">
              Comece sua jornada de <span className="italic">aprendizado!</span>
            </h2>
          </div>
        </section>

        <section className="relative hidden min-h-screen overflow-hidden lg:flex lg:flex-col lg:items-start lg:justify-end">
          <div className="absolute inset-0 bg-[linear-gradient(180deg,#e9e6b5_0%,#f2ae8f_42%,#ee65b2_72%,#974fc9_100%)] dark:bg-[linear-gradient(180deg,#49351e_0%,#5c382d_42%,#a33f70_72%,#5b2b78_100%)]" />
          <div className="relative z-10 flex w-full flex-col items-start gap-8 px-8 pb-14 text-left">
            <Image
              src="/images/auth/charathers.png"
              alt="Grupo de personagens"
              width={340}
              height={250}
              priority
              className="h-[250px] w-[340px] object-contain"
            />
            <h2 className="max-w-xl font-display text-4xl font-semibold leading-tight text-white xl:text-6xl">
              Comece sua jornada de <span className="italic">aprendizado!</span>
            </h2>
          </div>
        </section>
      </div>
    </main>
  );
}

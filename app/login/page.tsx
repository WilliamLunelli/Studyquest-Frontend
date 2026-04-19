"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useState } from "react";

function SocialButton({ src, alt }: { src: string; alt: string }) {
  return (
    <button
      type="button"
      className="flex flex-1 h-12 items-center justify-center rounded-full border border-slate-500/55 bg-transparent transition hover:bg-white/55"
    >
      <Image src={src} alt={alt} width={28} height={28} className="h-7 w-7" />
    </button>
  );
}

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const router = useRouter();

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const payload = (await response.json()) as { message: string };

      if (!response.ok) {
        setErrorMessage(payload.message || "Não foi possível fazer login.");
        return;
      }

      router.push("/dashboard");
    } catch {
        setErrorMessage("Erro de conexão. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="min-h-screen w-full bg-white">
      <div className="grid min-h-screen w-full overflow-hidden bg-white lg:grid-cols-[1fr_1fr]">
        <section className="flex min-h-screen items-center justify-center bg-[#efefef] px-4 py-10 sm:px-10 sm:py-12">
          <div className="w-full max-w-md">
            <h1 className="font-display text-3xl font-semibold text-slate-800 sm:text-[34px]">Entre</h1>
            <p className="mt-4 text-base text-slate-500 sm:text-[18px]">
              Ainda não cadastrado?{" "}
              <a href="#" className="font-medium text-slate-700 underline underline-offset-2">
                Cadastre-se
              </a>
            </p>

            <form className="mt-10 space-y-6" onSubmit={handleLogin}>
              <div className="space-y-2">
                <label htmlFor="email" className="block text-base text-slate-600 sm:text-[18px]">
                  E-mail:
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="exemplo@gmail.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  className="h-14 w-full rounded-2xl border border-slate-400/60 bg-[#efefef] px-4 text-base text-slate-700 outline-none placeholder:text-slate-400 focus:border-[#974FC9]/65 sm:text-lg"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="block text-base text-slate-600 sm:text-[18px]">
                  Digite sua senha:
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="******"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                    className="h-14 w-full rounded-2xl border border-slate-400/60 bg-[#efefef] px-4 pr-12 text-base text-slate-700 outline-none placeholder:text-slate-400 focus:border-[#974FC9]/65 sm:text-lg"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 transition hover:opacity-70"
                  >
                    <Image
                      src={showPassword ? "/images/auth/showPass/eye-on.png" : "/images/auth/showPass/eye-off.png"}
                      alt={showPassword ? "Hide password" : "Show password"}
                      width={20}
                      height={20}
                      className="h-5 w-5"
                    />
                  </button>
                </div>
                <div className="pt-1 text-right">
                  <a href="#" className="text-base font-medium text-slate-700 underline underline-offset-2 sm:text-lg">
                    Esqueceu sua senha?
                  </a>
                </div>
              </div>

              {errorMessage ? <p className="text-sm text-red-600">{errorMessage}</p> : null}

              <button
                type="submit"
                disabled={isLoading}
                className="mt-3 inline-flex h-14 w-full items-center justify-center rounded-full bg-gradient-to-r from-[#974FC9] via-[#F2AE8F] to-[#9FE4F1] text-xl font-semibold text-white transition hover:brightness-95 sm:text-[24px]"
              >
                {isLoading ? "Entrando..." : "Continuar"}
              </button>
            </form>

            <div className="mt-8 flex flex-wrap gap-3 sm:gap-4">
              <SocialButton src="/images/auth/logos/facebook.png" alt="Facebook" />
              <SocialButton src="/images/auth/logos/google.png" alt="Google" />
              <SocialButton src="/images/auth/logos/apple.png" alt="Apple" />
            </div>
          </div>
        </section>

        <section className="relative hidden min-h-screen overflow-hidden lg:flex lg:flex-col lg:items-center lg:justify-center">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_90%_20%,rgba(233,65,181,0.35),transparent_35%),linear-gradient(150deg,#e9e6b5_0%,#f2ae8f_48%,#bc53db_85%,#84d9ec_100%)]" />

          <div className="relative z-10 flex flex-col items-center gap-8 px-8 text-center">
            <Image
              src="/images/auth/charathers.png"
              alt="Grupo de personagens"
              width={340}
              height={250}
              priority
              className="h-auto w-[340px] max-w-full"
            />

            <h2 className="font-display text-4xl font-semibold leading-tight text-white xl:text-6xl">
              Comece sua jornada de <span className="italic">aprendizado!</span>
            </h2>
          </div>


        </section>
      </div>
    </main>
  );
}
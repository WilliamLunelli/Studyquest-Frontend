"use client";

import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
};

export function AuthInput({ label, className = "", ...props }: InputProps) {
  return (
    <label className="block space-y-2">
      <span className="block text-base text-slate-600 sm:text-[18px]">{label}</span>
      <input
        {...props}
        className={`h-12 w-full rounded-2xl border border-slate-400/60 bg-white px-4 text-base text-slate-700 outline-none placeholder:text-slate-400 focus:border-[#974FC9]/65 sm:h-14 sm:text-lg ${className}`}
      />
    </label>
  );
}

interface PasswordInputProps extends Omit<InputProps, "type"> {}

export function PasswordInput({ label, className = "", ...props }: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <label className="block space-y-2">
      <span className="block text-base text-slate-600 sm:text-[18px]">{label}</span>
      <span className="relative block">
        <input
          {...props}
          type={visible ? "text" : "password"}
          className={`h-12 w-full rounded-2xl border border-slate-400/60 bg-white px-4 pr-12 text-base text-slate-700 outline-none placeholder:text-slate-400 focus:border-[#974FC9]/65 sm:h-14 sm:text-lg ${className}`}
        />
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          aria-label={visible ? "Ocultar senha" : "Mostrar senha"}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-[#974FC9]"
        >
          {visible ? <EyeOff aria-hidden="true" size={20} /> : <Eye aria-hidden="true" size={20} />}
        </button>
      </span>
    </label>
  );
}

export function AuthError({ message }: { message: string }) {
  return message ? <p role="alert" className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700">{message}</p> : null;
}

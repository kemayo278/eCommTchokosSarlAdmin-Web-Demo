"use client";

import type { ReactNode } from "react";

export function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  suffix,
  error,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  suffix?: string;
  error?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-secondary">
        {label}{required && <span className="ml-0.5 text-danger">*</span>}
      </span>
      <div className={`mt-1.5 flex items-center gap-2 rounded-xl border bg-white px-3 focus-within:ring-2 ${
        error
          ? "border-danger focus-within:border-danger focus-within:ring-danger/20"
          : "border-slate-200 focus-within:border-primary focus-within:ring-primary/20"
      }`}>
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-transparent py-2.5 text-sm outline-none placeholder:text-slate-400"
        />
        {suffix && <span className="text-sm text-slate-400">{suffix}</span>}
      </div>
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
    </label>
  );
}

export function Textarea({
  label,
  value,
  onChange,
  placeholder,
  rows = 4,
  error,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
  error?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-secondary">{label}</span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className={`mt-1.5 w-full rounded-xl border bg-white px-3 py-2.5 text-sm outline-none placeholder:text-slate-400 focus:ring-2 ${
          error
            ? "border-danger focus:border-danger focus:ring-danger/20"
            : "border-slate-200 focus:border-primary focus:ring-primary/20"
        }`}
      />
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
    </label>
  );
}

export function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { valeur: string; libelle: string }[];
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-secondary">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
      >
        {options.map((o) => (
          <option key={o.valeur} value={o.valeur}>
            {o.libelle}
          </option>
        ))}
      </select>
    </label>
  );
}

export function Toggle({
  label,
  description,
  actif,
  onChange,
}: {
  label: string;
  description?: string;
  actif: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div>
        <p className="text-sm font-semibold text-secondary">{label}</p>
        {description && <p className="text-xs text-slate-400">{description}</p>}
      </div>
      <button
        role="switch"
        aria-checked={actif}
        onClick={() => onChange(!actif)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition ${
          actif ? "bg-primary" : "bg-slate-200"
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${
            actif ? "left-[22px]" : "left-0.5"
          }`}
        />
      </button>
    </div>
  );
}

export function FormRow({ children }: { children: ReactNode }) {
  return <div className="grid gap-4 sm:grid-cols-2">{children}</div>;
}

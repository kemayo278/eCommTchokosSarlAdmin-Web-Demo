import Link from "next/link";
import type { ReactNode } from "react";

export type Tone = "primary" | "warn" | "danger" | "info" | "neutral";

const toneStyles: Record<Tone, string> = {
  primary: "bg-primary-soft text-primary-dark",
  warn: "bg-warn-soft text-warn",
  danger: "bg-danger-soft text-danger",
  info: "bg-info-soft text-info",
  neutral: "bg-slate-100 text-slate-600",
};

export function Badge({ tone = "neutral", children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${toneStyles[tone]}`}>
      {children}
    </span>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-slate-100 bg-surface ${className}`}>
      {children}
    </div>
  );
}

export function SectionCard({
  title,
  action,
  children,
  className = "",
}: {
  title?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Card className={className}>
      {(title || action) && (
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
          {title && <h2 className="font-bold tracking-tight text-secondary">{title}</h2>}
          {action}
        </div>
      )}
      <div className="p-5">{children}</div>
    </Card>
  );
}

export function StatCard({
  label,
  valeur,
  icon,
  variation,
  tone = "primary",
}: {
  label: string;
  valeur: string;
  icon: ReactNode;
  variation?: string;
  tone?: Tone;
}) {
  const positive = variation ? variation.trim().startsWith("+") : false;
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${toneStyles[tone]}`}>
          {icon}
        </span>
        {variation && (
          <span className={`text-xs font-bold ${positive ? "text-primary-dark" : "text-danger"}`}>
            {variation}
          </span>
        )}
      </div>
      <p className="mt-4 text-2xl font-extrabold tracking-tight text-secondary">{valeur}</p>
      <p className="text-sm text-slate-500">{label}</p>
    </Card>
  );
}

export function PageHeader({
  titre,
  sousTitre,
  action,
}: {
  titre: string;
  sousTitre?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-1 flex-wrap items-center justify-between gap-x-6 gap-y-2">
      <div className="min-w-0">
        <h1 className="truncate text-2xl font-extrabold tracking-tight text-secondary">{titre}</h1>
        {sousTitre && (
          <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-400">
            <span className="h-1 w-1 shrink-0 rounded-full bg-primary" />
            {sousTitre}
          </p>
        )}
      </div>
      {action && <span className="shrink-0">{action}</span>}
    </div>
  );
}

export function Button({
  children,
  href,
  variant = "primary",
  onClick,
  type = "button",
  disabled = false,
  className = "",
}: {
  children: ReactNode;
  href?: string;
  variant?: "primary" | "secondary" | "ghost";
  onClick?: () => void | Promise<void>;
  type?: "button" | "submit";
  disabled?: boolean;
  className?: string;
}) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition";
  const styles = {
    primary: "bg-primary text-white hover:bg-primary-dark",
    secondary: "border border-slate-200 bg-surface text-secondary hover:border-primary/40",
    ghost: "text-slate-500 hover:bg-slate-50 hover:text-secondary",
  }[variant];

  if (href) {
    return (
      <Link href={href} className={`${base} ${styles} ${className}`}>
        {children}
      </Link>
    );
  }
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={`${base} ${styles} ${className} disabled:opacity-50 disabled:cursor-not-allowed`}>
      {children}
    </button>
  );
}

export function EmptyState({
  icon,
  titre,
  description,
}: {
  icon: ReactNode;
  titre: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-surface py-16 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-50 text-slate-300">
        {icon}
      </div>
      <p className="mt-3 font-semibold text-secondary">{titre}</p>
      <p className="text-sm text-slate-500">{description}</p>
    </div>
  );
}

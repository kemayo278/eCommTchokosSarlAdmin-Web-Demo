import Link from "next/link";
import { ShieldCheck } from "lucide-react";

interface AuthSidePanelProps {
  title: React.ReactNode;
  description: string;
}

export function AuthSidePanel({ title, description }: AuthSidePanelProps) {
  return (
    <section className="relative hidden flex-col justify-between overflow-hidden bg-secondary p-12 text-white lg:flex">
      <Link href="/" className="flex items-center gap-2.5">
        <div className="w-1 h-9 bg-primary rounded-full" />
        <div className="flex flex-col leading-none gap-0.5">
          <span className="font-black text-[22px] tracking-tight text-white leading-none">
            TCHOKOS<span className="text-primary">.</span>
          </span>
          <span className="text-[9px] font-semibold tracking-[0.4em] text-slate-400 uppercase">
            SARL
          </span>
        </div>
      </Link>

      <div className="max-w-md">
        <h1 className="text-4xl font-extrabold leading-tight tracking-tight">
          {title}
        </h1>
        <p className="mt-4 text-slate-300">{description}</p>
      </div>

      <div className="flex items-center gap-2 text-sm text-slate-400">
        <ShieldCheck className="h-4 w-4 text-primary" />
        Espace réservé à l&apos;administration · Douala, Cameroun
      </div>

      <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-16 right-10 h-56 w-56 rounded-full bg-primary/10 blur-3xl" />
    </section>
  );
}

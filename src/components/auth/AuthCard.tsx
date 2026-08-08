import Link from "next/link";

interface AuthCardProps {
  children: React.ReactNode;
}

export function AuthCard({ children }: AuthCardProps) {
  return (
    <section className="flex items-center justify-center px-5 py-10">
      <div className="w-full max-w-sm animate-rise">
        <div className="mb-8 flex flex-col items-center text-center lg:hidden">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-1 h-9 bg-primary rounded-full" />
            <div className="flex flex-col leading-none gap-0.5">
              <span className="font-black text-[22px] tracking-tight text-gray-900 leading-none">
                TCHOKOS<span className="text-primary">.</span>
              </span>
              <span className="text-[9px] font-semibold tracking-[0.4em] text-gray-400 uppercase">
                SARL
              </span>
            </div>
          </Link>
          <p className="mt-4 text-sm text-slate-500">
            Espace d&apos;administration
          </p>
        </div>

        <div className="rounded-3xl border border-white/60 bg-white/80 p-6 shadow-[0_20px_60px_-24px_rgba(15,23,42,0.25)] backdrop-blur">
          {children}
        </div>

        <p className="mt-6 text-center text-xs text-slate-400">
          Accès sécurisé · Tchokos Sarl
        </p>
      </div>
    </section>
  );
}

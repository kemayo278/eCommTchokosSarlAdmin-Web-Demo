import { AlertTriangle, RotateCcw } from "lucide-react"

import { Button } from "@/components/ui/button"

interface ErrorAlertProps {
  title? : string;
  message ?: string | null;
  onRetry?: () => void;
}

export default function ErrorAlert({ title, message, onRetry }: ErrorAlertProps) {
  const heading = title?.trim() || "Une erreur est survenue";
  const description = message?.trim() || "Impossible d’afficher cette section pour le moment.";

  return (
    <div
      role="alert"
      className="relative overflow-hidden rounded-2xl border border-red-200 bg-linear-to-br from-red-50 via-white to-rose-50 p-5 text-red-950 shadow-[0_12px_40px_-24px_rgba(239,68,68,0.45)]"
    >
      <div className="absolute inset-x-0 top-0 h-1 bg-linear-to-r from-red-500 via-rose-500 to-orange-400" />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-red-100 text-red-600 ring-1 ring-red-200">
            <AlertTriangle className="h-5 w-5" />
          </span>

          <div className="min-w-0 space-y-1">
            <p className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-red-700">
              Erreur
            </p>
            <p className="text-base font-semibold tracking-tight text-red-950">{heading}</p>
            <p className="max-w-2xl text-sm leading-6 text-red-700/90">{description}</p>
          </div>
        </div>

        {onRetry && (
          <Button
            variant="outline"
            onClick={onRetry}
            className="shrink-0 border-red-200 bg-white/80 text-red-700 shadow-sm hover:border-red-300 hover:bg-red-50 hover:text-red-800"
          >
            <RotateCcw className="h-4 w-4" />
            Réessayer
          </Button>
        )}
      </div>
    </div>
  );
}

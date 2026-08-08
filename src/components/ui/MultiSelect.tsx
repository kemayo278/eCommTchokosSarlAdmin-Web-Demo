"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";

export function MultiSelect({
  label,
  options,
  selected,
  onChange,
  placeholder = "Sélectionner…",
}: {
  label: string;
  options: string[];
  selected: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
}) {
  const [choix, setChoix] = useState("");
  const disponibles = options.filter((o) => !selected.includes(o));

  function ajouter() {
    if (choix && !selected.includes(choix)) {
      onChange([...selected, choix]);
      setChoix("");
    }
  }

  function retirer(v: string) {
    onChange(selected.filter((s) => s !== v));
  }

  return (
    <div>
      <span className="text-sm font-semibold text-secondary">{label}</span>
      <div className="mt-1.5 flex gap-2">
        <select
          value={choix}
          onChange={(e) => setChoix(e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
        >
          <option value="">{placeholder}</option>
          {disponibles.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={ajouter}
          disabled={!choix}
          className="flex shrink-0 items-center gap-1 rounded-xl bg-secondary px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-secondary-soft disabled:opacity-40"
        >
          <Plus className="h-4 w-4" /> Ajouter
        </button>
      </div>

      {selected.length > 0 && (
        <div className="mt-2.5 flex flex-wrap gap-2">
          {selected.map((s) => (
            <span
              key={s}
              className="flex items-center gap-1.5 rounded-full bg-primary-soft px-3 py-1.5 text-xs font-semibold text-primary-dark"
            >
              {s}
              <button type="button" onClick={() => retirer(s)} aria-label={`Retirer ${s}`}>
                <X className="h-3.5 w-3.5" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

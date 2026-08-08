"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";

export interface Column<T> {
  cle: string;
  entete: string;
  aligne?: "left" | "right" | "center";
  rendu: (ligne: T) => ReactNode;
  masquerMobile?: boolean;
}

export function DataTable<T>({
  columns,
  rows,
  link,
}: {
  columns: Column<T>[];
  rows: T[];
  link?: (row: T) => string;
}) {
  const router = useRouter();
  const align = (a?: string) =>
    a === "right" ? "text-right" : a === "center" ? "text-center" : "text-left";

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-100 bg-surface">
      <div className="scroll-slim overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/60">
              {columns.map((c) => (
                <th
                  key={c.cle}
                  className={`px-5 py-3 font-semibold text-slate-500 ${align(c.aligne)} ${
                    c.masquerMobile ? "hidden md:table-cell" : ""
                  }`}
                >
                  {c.entete}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {rows.map((row, i) => {
              const href = link?.(row);
              return (
                <tr
                  key={i}
                  onClick={href ? () => router.push(href) : undefined}
                  className={`transition ${
                    href
                      ? "cursor-pointer hover:bg-primary-soft/30"
                      : "hover:bg-slate-50/50"
                  }`}
                >
                  {columns.map((c) => (
                    <td
                      key={c.cle}
                      className={`px-5 py-3.5 ${align(c.aligne)} ${
                        c.masquerMobile ? "hidden md:table-cell" : ""
                      }`}
                    >
                      {c.rendu(row)}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

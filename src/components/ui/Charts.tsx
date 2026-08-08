"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const axe = { fontSize: 12, fill: "#94a3b8" };
const fmt = (n: number) =>
  n >= 1_000_000
    ? (n / 1_000_000).toFixed(1) + "M"
    : n >= 1000
      ? Math.round(n / 1000) + "k"
      : String(n);

export function AireVentes({
  data,
  cle,
  x,
}: {
  data: Record<string, number | string>[];
  cle: string;
  x: string;
}) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data} margin={{ left: -10, right: 8, top: 8 }}>
        <defs>
          <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity={0.28} />
            <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
        <XAxis dataKey={x} tick={axe} axisLine={false} tickLine={false} />
        <YAxis tick={axe} axisLine={false} tickLine={false} tickFormatter={fmt} />
        <Tooltip
          formatter={(v) => [fmt(Number(v)) + " FCFA", "Ventes"]}
          contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }}
        />
        <Area
          type="monotone"
          dataKey={cle}
          stroke="#10b981"
          strokeWidth={2.5}
          fill="url(#grad)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function BarresVentes({
  data,
  cle,
  x,
}: {
  data: Record<string, number | string>[];
  cle: string;
  x: string;
}) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ left: -10, right: 8, top: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
        <XAxis dataKey={x} tick={axe} axisLine={false} tickLine={false} />
        <YAxis tick={axe} axisLine={false} tickLine={false} tickFormatter={fmt} />
        <Tooltip
          formatter={(v) => [fmt(Number(v)) + " FCFA", "Montant"]}
          contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }}
          cursor={{ fill: "#f8fafc" }}
        />
        <Bar dataKey={cle} fill="#10b981" radius={[6, 6, 0, 0]} barSize={28} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function LigneCommandes({
  data,
  cle,
  x,
}: {
  data: Record<string, number | string>[];
  cle: string;
  x: string;
}) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data} margin={{ left: -10, right: 8, top: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
        <XAxis dataKey={x} tick={axe} axisLine={false} tickLine={false} />
        <YAxis tick={axe} axisLine={false} tickLine={false} />
        <Tooltip
          contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }}
        />
        <Line
          type="monotone"
          dataKey={cle}
          stroke="#0f172a"
          strokeWidth={2.5}
          dot={{ r: 3, fill: "#0f172a" }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function CamembertPaiements({
  data,
}: {
  data: { nom: string; valeur: number; couleur: string }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie
          data={data}
          dataKey="valeur"
          nameKey="nom"
          innerRadius={55}
          outerRadius={90}
          paddingAngle={3}
        >
          {data.map((d) => (
            <Cell key={d.nom} fill={d.couleur} />
          ))}
        </Pie>
        <Tooltip
          formatter={(v, n) => [Number(v) + " %", String(n)]}
          contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }}
        />
        <Legend
          iconType="circle"
          wrapperStyle={{ fontSize: 12, color: "#64748b" }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

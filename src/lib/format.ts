export function initiales(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function fcfa(montant: number): string {
  return new Intl.NumberFormat("fr-FR").format(Math.round(montant)) + " FCFA";
}

export function nombre(n: number): string {
  return new Intl.NumberFormat("fr-FR").format(n);
}

export function pourcent(n: number): string {
  return (n > 0 ? "+" : "") + n.toFixed(1) + " %";
}

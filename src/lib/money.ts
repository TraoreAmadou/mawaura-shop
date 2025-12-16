// Convention : les champs historiques `priceCents` / `totalCents` représentent
// désormais des montants en FCFA (XOF) — entiers (pas de décimales).

export function formatXOF(amount: number): string {
    const n = Number(amount);
    const safe = Number.isFinite(n) ? n : 0;
    const rounded = Math.round(safe);
  
    return `${new Intl.NumberFormat("fr-FR", {
      maximumFractionDigits: 0,
    }).format(rounded)} FCFA`;
  }

  
  
  export function parseXOF(input: number | string): number {
    if (typeof input === "number") return Math.round(input);
  
    const raw = String(input ?? "")
      .trim()
      .replace(/\s/g, "")
      .replace(/(FCFA|XOF|CFA|F)/gi, "")
      .replace(",", ".");
  
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? Math.round(parsed) : 0;
  }
  
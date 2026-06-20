import { Scientist } from "@/data/scientists";
import { findScientist, gameDayKey, getDailyScientist } from "@/lib/game";

// Resolve o cientista do dia no SERVIDOR — fonte de verdade. Aplica o override
// secreto (env DAILY_OVERRIDES) sobre o sorteio determinístico padrão.
// NÃO importar de componentes do cliente: lê process.env do servidor.
export function resolveDailyTarget(date = new Date()): Scientist {
  try {
    const raw = process.env.DAILY_OVERRIDES;
    if (raw) {
      const map = JSON.parse(raw) as Record<string, string>;
      const wanted = map[gameDayKey(date)];
      const found = wanted ? findScientist(wanted) : undefined;
      if (found) return found;
    }
  } catch {
    /* JSON inválido: ignora e usa o sorteio padrão */
  }
  return getDailyScientist(date);
}

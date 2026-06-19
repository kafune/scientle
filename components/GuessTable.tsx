import { COUNTRY_FLAG } from "@/data/scientists";
import { CellResult, GuessResult } from "@/lib/game";
import ScientistImage from "./ScientistImage";

function genderLabel(g: "M" | "F") {
  return g === "M" ? "Masculino" : "Feminino";
}

function Tile({
  label,
  result,
  value,
  flag,
  hint,
}: {
  label: string;
  result: CellResult;
  value: React.ReactNode;
  flag?: string;
  hint?: string;
}) {
  const arrow =
    result.direction === "up" ? "↑" : result.direction === "down" ? "↓" : null;
  return (
    <div
      className={`tile ${result.match}${hint ? " has-hint" : ""}`}
      tabIndex={hint ? 0 : undefined}
      aria-label={hint ? `${label}. ${hint}` : undefined}
    >
      {hint && (
        <span className="tile-cue" aria-hidden="true">
          ?
        </span>
      )}
      <div className="tile-label">{label}</div>
      <div className="tile-value">
        {flag && <span className="flag">{flag}</span>}
        <span>{value}</span>
        {arrow && <span className="tarrow">{arrow}</span>}
      </div>
      {hint && (
        <span className="tile-hint" role="note">
          {hint}
        </span>
      )}
    </div>
  );
}

function Card({ g }: { g: GuessResult }) {
  const s = g.scientist;
  return (
    <div className={`guess-card ${g.isWin ? "win" : ""}`}>
      <div className="guess-head">
        <ScientistImage name={s.name} size={52} />
        <span className="guess-name">{s.name}</span>
      </div>
      <div className="tiles">
        <Tile
          label="Área"
          result={g.field}
          value={s.field}
          hint="Amarelo: mesma grande área (exatas, formais ou vida)."
        />
        <Tile
          label="Nascimento"
          result={g.birthYear}
          value={s.birthYear}
          hint="Amarelo: nascimento a até 25 anos de distância. ↑/↓ indica se o alvo nasceu depois/antes."
        />
        <Tile
          label="País"
          result={g.nationality}
          value={s.nationality}
          flag={COUNTRY_FLAG[s.nationality]}
        />
        <Tile label="Gênero" result={g.gender} value={genderLabel(s.gender)} />
        <Tile
          label="Prêmio"
          result={g.award}
          value={s.award}
          hint="Amarelo: ambos têm um prêmio Nobel, mas de categorias diferentes."
        />
        <Tile
          label="Status"
          result={g.alive}
          value={s.alive ? "Vivo" : "Falecido"}
        />
      </div>
    </div>
  );
}

export default function GuessTable({ guesses }: { guesses: GuessResult[] }) {
  // Mais recente no topo, como no Spotle original.
  const ordered = [...guesses].reverse();
  return (
    <div className="guesses">
      {ordered.map((g) => (
        <Card key={g.scientist.name} g={g} />
      ))}
    </div>
  );
}

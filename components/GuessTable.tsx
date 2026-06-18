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
}: {
  label: string;
  result: CellResult;
  value: React.ReactNode;
  flag?: string;
}) {
  const arrow =
    result.direction === "up" ? "↑" : result.direction === "down" ? "↓" : null;
  return (
    <div className={`tile ${result.match}`}>
      <div className="tile-label">{label}</div>
      <div className="tile-value">
        {flag && <span className="flag">{flag}</span>}
        <span>{value}</span>
        {arrow && <span className="tarrow">{arrow}</span>}
      </div>
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
        <Tile label="Área" result={g.field} value={s.field} />
        <Tile label="Nascimento" result={g.birthYear} value={s.birthYear} />
        <Tile
          label="País"
          result={g.nationality}
          value={s.nationality}
          flag={COUNTRY_FLAG[s.nationality]}
        />
        <Tile label="Gênero" result={g.gender} value={genderLabel(s.gender)} />
        <Tile label="Prêmio" result={g.award} value={s.award} />
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

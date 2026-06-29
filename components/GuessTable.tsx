import { FIELDS_BY_GROUP } from "@/data/scientists";
import { CellResult, GuessResult } from "@/lib/game";
import Flag from "./Flag";
import ScientistImage from "./ScientistImage";

// Dica da Área. A versão em texto (AREA_HINT) alimenta o aria-label; a versão
// estruturada (AREA_HINT_BODY) é o painelzinho visual com cada grande área e
// suas disciplinas, para a pista amarela não ficar vaga.
const AREA_HINT =
  "Amarelo: mesma grande área — " +
  FIELDS_BY_GROUP.map((g) => `${g.label}: ${g.fields.join(", ")}`).join("; ") +
  ".";

const AREA_HINT_BODY = (
  <>
    <span className="hint-title">
      <span className="hint-swatch close" aria-hidden="true" />
      Amarelo: mesma grande área
    </span>
    <span className="hint-groups">
      {FIELDS_BY_GROUP.map((g) => (
        <span className="hint-group" key={g.group}>
          <b>{g.label}</b>
          <span>{g.fields.join(" · ")}</span>
        </span>
      ))}
    </span>
  </>
);

function genderLabel(g: "M" | "F") {
  return g === "M" ? "Masculino" : "Feminino";
}

// Ícone + rótulo textual do estado, para não depender só da cor (daltonismo).
const MATCH_META: Record<
  CellResult["match"],
  { icon: string; label: string }
> = {
  correct: { icon: "✓", label: "correto" },
  close: { icon: "≈", label: "parcial" },
  wrong: { icon: "✕", label: "incorreto" },
};

function Tile({
  label,
  result,
  value,
  country,
  hint,
  hintBody,
}: {
  label: string;
  result: CellResult;
  value: React.ReactNode;
  // País a exibir como bandeira (SVG) antes do valor.
  country?: string;
  hint?: string;
  // Conteúdo rico do painelzinho; cai no texto `hint` quando ausente.
  hintBody?: React.ReactNode;
}) {
  const arrow =
    result.direction === "up" ? "↑" : result.direction === "down" ? "↓" : null;
  const meta = MATCH_META[result.match];
  return (
    <div
      className={`tile ${result.match}${hint ? " has-hint" : ""}`}
      tabIndex={hint ? 0 : undefined}
      aria-label={hint ? `${label}, ${meta.label}. ${hint}` : undefined}
    >
      {hint && (
        <span className="tile-cue" aria-hidden="true">
          ?
        </span>
      )}
      <div className="tile-label">
        <span className="tile-status" aria-hidden="true">
          {meta.icon}
        </span>
        {label}
        <span className="sr-only"> — {meta.label}</span>
      </div>
      <div className="tile-value">
        {country && <Flag country={country} size={20} />}
        <span>{value}</span>
        {arrow && <span className="tarrow">{arrow}</span>}
      </div>
      {hint && (
        <span
          className={`tile-hint${hintBody ? " rich" : ""}`}
          role="note"
          aria-hidden="true"
        >
          {hintBody ?? hint}
        </span>
      )}
    </div>
  );
}

function Card({ g }: { g: GuessResult }) {
  const s = g.scientist;
  const nc = Object.values(g).filter(
    (v) => typeof v === "object" && v !== null && "match" in v && (v as { match: string }).match === "correct"
  ).length;
  const cc = Object.values(g).filter(
    (v) => typeof v === "object" && v !== null && "match" in v && (v as { match: string }).match === "close"
  ).length;
  return (
    <div className={`guess-card ${g.isWin ? "win" : ""}`}>
      <div className="guess-head">
        <ScientistImage name={s.name} size={52} />
        <span className="guess-name">{s.name}</span>
        <span className="guess-summary" title={`${nc} corretos, ${cc} próximos`}>
          <b>✓ {nc}</b> · <i>≈ {cc}</i>
        </span>
      </div>
      <div className="tiles">
        <Tile
          label="Área"
          result={g.field}
          value={s.field}
          hint={AREA_HINT}
          hintBody={AREA_HINT_BODY}
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
          country={s.nationality}
          hint="Amarelo: mesmo continente, mas país diferente."
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

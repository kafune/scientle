// Avatar de monograma: iniciais sobre um gradiente determinístico pelo nome.
// Sempre funciona offline e serve de fallback quando não há foto.

function initials(name: string): string {
  const parts = name.split(" ").filter(Boolean);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}

function hueFor(name: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  }
  return hash % 360;
}

export default function Avatar({
  name,
  size = 36,
}: {
  name: string;
  size?: number;
}) {
  const h = hueFor(name);
  return (
    <span
      className="avatar"
      aria-hidden="true"
      style={{
        width: size,
        height: size,
        fontSize: Math.round(size * 0.38),
        background: `linear-gradient(135deg, hsl(${h} 58% 48%), hsl(${(h + 40) % 360} 58% 36%))`,
      }}
    >
      {initials(name)}
    </span>
  );
}

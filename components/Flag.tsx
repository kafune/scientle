import { COUNTRY_FLAG, COUNTRY_ISO } from "@/data/scientists";

// Bandeira do país como imagem SVG local (public/flags/<iso>.svg). Mais
// confiável que o emoji de bandeira, que não renderiza em vários dispositivos
// (Windows, Androids antigos). O emoji segue como rótulo acessível.
export default function Flag({
  country,
  size = 20,
  className,
}: {
  country: string;
  size?: number;
  className?: string;
}) {
  const iso = COUNTRY_ISO[country];
  if (!iso) return null;
  return (
    <img
      className={`flag${className ? ` ${className}` : ""}`}
      src={`/flags/${iso}.svg`}
      alt={COUNTRY_FLAG[country] ?? country}
      width={size}
      height={Math.round((size * 3) / 4)}
      loading="lazy"
      decoding="async"
      draggable={false}
    />
  );
}

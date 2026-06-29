import { SCIENTIST_IMAGES } from "@/data/images";
import Avatar from "./Avatar";

// Foto local do cientista (instantânea, servida de public/scientists/).
// Cai para o avatar de monograma quando não há foto disponível.
export default function ScientistImage({
  name,
  size = 52,
}: {
  name: string;
  size?: number;
}) {
  const src = SCIENTIST_IMAGES[name];
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        className="reveal-photo"
        src={src}
        alt={name}
        width={size}
        height={size}
        style={{ width: size, height: size }}
        loading="lazy"
        decoding="async"
      />
    );
  }
  return <Avatar name={name} size={size} />;
}

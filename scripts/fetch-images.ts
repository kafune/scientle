// Baixa as fotos dos cientistas da Wikipedia para public/scientists/
// e gera data/images.ts com o mapa nome -> caminho local.
// Rodar com: ~/.bun/bin/bun run scripts/fetch-images.ts

import { mkdir, readdir } from "node:fs/promises";
import { SCIENTISTS } from "../data/scientists";

const OUT_DIR = new URL("../public/scientists/", import.meta.url);
await mkdir(OUT_DIR, { recursive: true });

const UA =
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36";

function slug(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

async function thumbOnce(title: string, lang: string): Promise<string | null> {
  const url =
    `https://${lang}.wikipedia.org/w/api.php?action=query&format=json` +
    `&prop=pageimages&piprop=thumbnail&redirects=1&pithumbsize=256` +
    `&titles=${encodeURIComponent(title)}`;
  const r = await fetch(url, { headers: { "User-Agent": UA } });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  const data: any = await r.json();
  const pages = data?.query?.pages ?? {};
  const page: any = Object.values(pages)[0];
  return page?.thumbnail?.source ?? null;
}

// Títulos específicos para nomes ambíguos (ex.: desambiguação).
const OVERRIDES: Record<string, { pt?: string; en?: string }> = {
  "Margaret Hamilton": { en: "Margaret Hamilton (software engineer)" },
};

// Tenta pt e en, com retry/backoff para tolerar rate limiting.
async function thumb(name: string): Promise<string | null> {
  const ov = OVERRIDES[name] ?? {};
  for (let attempt = 0; attempt < 4; attempt++) {
    for (const lang of ["pt", "en"] as const) {
      const title = ov[lang] ?? name;
      try {
        const src = await thumbOnce(title, lang);
        if (src) return src;
      } catch {
        await sleep(500 * (attempt + 1));
      }
    }
    await sleep(150);
  }
  return null;
}

async function download(src: string, file: string): Promise<boolean> {
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const img = await fetch(src, {
        headers: { "User-Agent": UA, Referer: "https://pt.wikipedia.org/" },
      });
      if (img.ok) {
        await Bun.write(
          new URL(file, OUT_DIR),
          new Uint8Array(await img.arrayBuffer()),
        );
        return true;
      }
    } catch {
      /* tenta de novo */
    }
    await sleep(500 * (attempt + 1));
  }
  return false;
}

// Resume: reaproveita imagens já presentes em public/scientists/.
const existing = new Map<string, string>();
for (const f of await readdir(OUT_DIR)) {
  existing.set(f.replace(/\.[^.]+$/, ""), f);
}

const map: Record<string, string> = {};
let ok = 0;

for (const s of SCIENTISTS) {
  const sg = slug(s.name);
  const cached = existing.get(sg);
  if (cached) {
    map[s.name] = `/scientists/${cached}`;
    ok++;
    continue;
  }

  await sleep(250); // espaça as chamadas para evitar rate limiting
  const src = await thumb(s.name);
  if (!src) {
    console.log("  MISS  ", s.name);
    continue;
  }
  const ext = (src.split("?")[0].match(/\.(jpe?g|png|gif)$/i)?.[1] ?? "jpg")
    .toLowerCase()
    .replace("jpeg", "jpg");
  const file = `${sg}.${ext}`;
  if (await download(src, file)) {
    map[s.name] = `/scientists/${file}`;
    ok++;
    console.log("  OK    ", s.name, "->", file);
  } else {
    console.log("  DLFAIL", s.name);
  }
}

const lines = Object.entries(map)
  .map(([k, v]) => `  ${JSON.stringify(k)}: ${JSON.stringify(v)},`)
  .join("\n");
const out =
  "// Gerado por scripts/fetch-images.ts — não editar à mão.\n" +
  "export const SCIENTIST_IMAGES: Record<string, string> = {\n" +
  lines +
  "\n};\n";
await Bun.write(new URL("../data/images.ts", import.meta.url), out);

console.log(`\nTOTAL: ${ok}/${SCIENTISTS.length} imagens baixadas.`);

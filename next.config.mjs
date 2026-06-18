/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Emite um servidor Node mínimo e autossuficiente em .next/standalone,
  // ideal para imagens Docker enxutas.
  output: "standalone",
  // O tracer não segue o require dinâmico de postgres-array feito por pg-types
  // ao parsear colunas text[] (ex.: guessNames). Forçamos a inclusão para o
  // standalone não quebrar em runtime ao ler/gravar arrays.
  outputFileTracingIncludes: {
    "/": ["./node_modules/postgres-array/**/*"],
    "/api/auth/[...nextauth]": ["./node_modules/postgres-array/**/*"],
  },
};

export default nextConfig;

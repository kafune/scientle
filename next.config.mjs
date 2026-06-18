/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Emite um servidor Node mínimo e autossuficiente em .next/standalone,
  // ideal para imagens Docker enxutas.
  output: "standalone",
};

export default nextConfig;

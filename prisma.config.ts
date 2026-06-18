import { defineConfig, env } from "prisma/config";

// Carrega .env local quando existir; em produção as vars já vêm do ambiente.
try {
  process.loadEnvFile();
} catch {
  /* sem .env: usa as variáveis já presentes no ambiente (container) */
}

// Prisma 7: a URL de conexão saiu do schema. O Migrate (CLI) usa esta config;
// o client em runtime usa o driver adapter em lib/prisma.ts.
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});

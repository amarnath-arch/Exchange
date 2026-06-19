// prisma.config.ts
import "dotenv/config";
import { defineConfig, env } from "prisma/config";

const target = process.env.PRISMA_TARGET; // "auth" or "market"

export default defineConfig({
  schema:
    target === "market"
      ? "prisma/market/schema.prisma"
      : "prisma/auth/schema.prisma",
  migrations: {
    path:
      target === "market"
        ? "prisma/market/migrations"
        : "prisma/auth/migrations",
  },
  datasource: {
    url:
      target === "market"
        ? env("MARKET_DATABASE_URL")
        : env("AUTH_DATABASE_URL"),
  },
});

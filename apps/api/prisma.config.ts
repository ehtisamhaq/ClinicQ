import { defineConfig } from "prisma/config";
import { PrismaPg } from "@prisma/adapter-pg";

// Prisma 7+ stores connection config here instead of schema.prisma
// See: https://pris.ly/d/config-datasource
export default defineConfig({
  earlyAccess: true,
  schema: "./prisma/schema.prisma",
  migrate: {
    async adapter(env) {
      const { Pool } = await import("pg");
      const pool = new Pool({ connectionString: env.DATABASE_URL });
      return new PrismaPg(pool);
    },
  },
});

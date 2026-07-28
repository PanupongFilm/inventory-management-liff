import "dotenv/config";

export default {
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    name: "db",
    provider: "postgresql",
    connectionString: process.env.DATABASE_URL,
  },
};

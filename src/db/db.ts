import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { logger } from "../logger";

const pool = new Pool({
  host: "127.0.0.1",
  port: 5432,
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DB,
});

export const db = drizzle(pool, {
  logger: {
    logQuery: (query, params) => {
      logger.info({ query, params });
    },
  },
});

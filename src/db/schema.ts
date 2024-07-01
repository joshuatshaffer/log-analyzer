import { jsonb, pgTable, serial } from "drizzle-orm/pg-core";

export const journalEntries = pgTable("journal_entries", {
  id: serial("id").primaryKey(),
  fields: jsonb("fields").notNull(),
});

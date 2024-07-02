import { jsonb, pgTable, serial, text } from "drizzle-orm/pg-core";

export const journalEntries = pgTable("journal_entries", {
  id: serial("id").primaryKey(),
  cursor: text("cursor").notNull().unique(),
  fields: jsonb("fields").notNull(),
});

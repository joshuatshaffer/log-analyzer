import { asc } from "drizzle-orm";
import { db } from "./db/db";
import { journalEntries } from "./db/schema";

export async function ListJournalEntries() {
  const entries = await db
    .select()
    .from(journalEntries)
    .limit(100)
    .orderBy(asc(journalEntries.id));

  return (
    <body>
      <ul>
        {entries.map((entry) => (
          <li>
            {entry.id} <pre>{JSON.stringify(entry.fields, null, 2)}</pre>
          </li>
        ))}
      </ul>
    </body>
  );
}

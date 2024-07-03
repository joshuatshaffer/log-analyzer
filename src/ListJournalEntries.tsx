import { db } from "./db/db";
import { journalEntries } from "./db/schema";

export function ListJournalEntries() {
  return (
    <body>
      <ul>
        {(async function* () {
          for (const entry of await db.select().from(journalEntries).limit(2)) {
            yield (
              <li>
                {entry.id} <pre>{JSON.stringify(entry.fields, null, 2)}</pre>
              </li>
            );
          }
        })()}
      </ul>
    </body>
  );
}

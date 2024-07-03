import { db } from "./db/db";
import { journalEntries } from "./db/schema";

export function ListJournalEntries() {
  return (
    <body>
      <ul>
        {db
          .select()
          .from(journalEntries)
          .limit(10)
          .then((entries) =>
            entries.map((entry) => (
              <li>
                {entry.id} <pre>{JSON.stringify(entry.fields, null, 2)}</pre>
              </li>
            ))
          )}
      </ul>
    </body>
  );
}

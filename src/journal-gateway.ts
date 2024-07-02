const gatewayUrl = new URL(
  process.env.JOURNAL_GATEWAY_URL ?? "https://systemd-journal-gatewayd.example/"
);

const entriesUrl = new URL("entries", gatewayUrl);

const username = process.env.JOURNAL_GATEWAY_USERNAME ?? "john-doe";
const password = process.env.JOURNAL_GATEWAY_PASSWORD ?? "example password";

const Authorization =
  "Basic " + Buffer.from(username + ":" + password).toString("base64");

function rangeEntries({ start = "", skip = 0, take = 200 } = {}) {
  return `entries=${start}${skip ? `:${skip}` : ""}:${take}`;
}

export async function getEntries({
  range,
}: { range?: { start?: string; skip?: number; take?: number } } = {}) {
  const response = await fetch(entriesUrl, {
    method: "GET",
    headers: {
      Accept: "application/json",
      Authorization,
      Range: rangeEntries(range),
    },
  });

  const text = await response.text();

  return text
    .split("\n")
    .filter((x) => x)
    .map((line) => JSON.parse(line));
}

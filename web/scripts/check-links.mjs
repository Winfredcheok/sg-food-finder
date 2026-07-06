// Checks every entry's reviewUrl (and reviewer site) is still reachable.
// Run with: npm run check-links
// Exit code 1 if any URL hard-fails. 403/429 are reported as "blocked"
// (bot protection) rather than dead — verify those manually in a browser.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const entries = JSON.parse(readFileSync(join(root, "data/entries.json"), "utf8"));

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36";

async function check(url) {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": UA, Accept: "text/html,*/*" },
        redirect: "follow",
        signal: AbortSignal.timeout(15000),
      });
      return res.status;
    } catch (err) {
      if (attempt === 1) return `unreachable (${err.cause?.code ?? err.name})`;
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
}

const urls = new Map(); // url -> entry ids
for (const e of entries) {
  if (!urls.has(e.reviewUrl)) urls.set(e.reviewUrl, []);
  urls.get(e.reviewUrl).push(e.id);
}

console.log(`Checking ${urls.size} unique review URLs across ${entries.length} entries…\n`);
let dead = 0, blocked = 0;
for (const [url, ids] of urls) {
  const status = await check(url);
  const ok = typeof status === "number" && status >= 200 && status < 400;
  const isBlocked = status === 403 || status === 429 || status === 999;
  if (ok) continue;
  if (isBlocked) {
    blocked++;
    console.log(`BLOCKED (${status}) — verify manually in a browser:\n  ${url}\n  entries: ${ids.join(", ")}\n`);
  } else {
    dead++;
    console.log(`DEAD (${status}):\n  ${url}\n  entries: ${ids.join(", ")}\n  try archive: https://web.archive.org/web/*/${url}\n`);
  }
  await new Promise((r) => setTimeout(r, 300));
}

console.log(`${urls.size - dead - blocked} OK, ${blocked} blocked (manual check), ${dead} dead`);
if (dead > 0) process.exit(1);

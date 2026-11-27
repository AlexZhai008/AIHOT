// One GitHub Pages refresh. The standing server uses the same collectors and queue handlers.
import { setTimeout as sleep } from "node:timers/promises";
import { closeDb, sql } from "@aihot/backend/db";
import { computeHotRanking } from "@aihot/backend/events/hot";
import { registerContentJobs, registerExtractionJobs, sweepUnprocessed } from "@aihot/backend/jobs/content";
import { registerEventJobs, sweepUngrouped } from "@aihot/backend/jobs/events";
import { getBoss, QUEUES, stopBoss } from "@aihot/backend/jobs/queue";
import { installModules } from "@aihot/backend/modules";
import { composeDueReports } from "@aihot/backend/reports/compose";
import { collectSource } from "@aihot/backend/sources/collect";
import { SERVER_MODULES } from "@aihot/site/modules/server";

async function waitForPublications() {
  const limit = Date.now() + 18 * 60_000;
  const queues = [QUEUES.extractBody, QUEUES.analyze, QUEUES.group];
  while (Date.now() < limit) {
    const work = await sql`
      SELECT 1 FROM pgboss.job WHERE name IN ${sql(queues)}
        AND (state = 'active' OR (state IN ('created', 'retry') AND start_after <= now())) LIMIT 1`;
    if (!work.length) return;
    await sleep(2_000);
  }
  throw new Error("The article queue did not drain within the Pages refresh window");
}

if (process.env.COLLECT_ENABLED !== "true" || process.env.MODEL_CALLS_ENABLED !== "true" || !process.env.LLM_API_KEY) {
  throw new Error("Pages refresh requires an explicitly enabled collector and model API key");
}

installModules(SERVER_MODULES);
try {
  const boss = await getBoss({ supervise: true });
  await registerExtractionJobs(boss);
  await registerContentJobs(boss);
  await registerEventJobs(boss);
  const sources = await sql<{ id: string }[]>`SELECT id FROM sources WHERE enabled ORDER BY id`;
  const results = [];
  for (const { id } of sources) {
    const { status, found, created, revised } = await collectSource(id);
    results.push(status);
    console.log(JSON.stringify({ source: id, status, found, created, revised }));
  }
  if (results.every(status => status === "failed" || status === "skipped")) {
    throw new Error("No enabled source could be collected; keeping the published site");
  }
  await sweepUnprocessed();
  await sweepUngrouped();
  await waitForPublications();
  await computeHotRanking();
  console.log(JSON.stringify(await composeDueReports()));
} finally {
  await stopBoss();
  await closeDb();
}

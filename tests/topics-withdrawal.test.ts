// A withdrawn report leaves the topic pages at once, though the topic index behind them
// is kept for a minute. Its own file: the index is cached per process, and this needs it cold.
// The way it can go wrong: the page's or the index page's latest headline still shows the title from
// the cached index after the withdrawal. Corrections can also leave an old headline or keep a report in
// a company it no longer belongs to; check them before cache expiry.
import { topicTag as T, withdrawalReports } from "./topic-fixtures.ts";
import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { closeDb, sql } from "@aihot/backend/db";
import { stopBoss } from "@aihot/backend/jobs/queue";
import { listTopicSummaries, loadTopicPage } from "@aihot/backend/publication/topics";
import { overrideFields } from "@aihot/backend/admin/content";

let older: string;
let newer: string;
let corrected: string;

before(async () => {
  ({ older, newer, corrected } = await withdrawalReports());
  // All scenarios share this one cold index, then exercise the cache without waiting a minute.
  await loadTopicPage("orthok", 1);
});
after(async () => {
  await stopBoss();
  await closeDb();
});

test("a withdrawn report leaves the topic page and the index while the topic index is still cached", async () => {
  // Both are read into the cached index.
  const before = await loadTopicPage("orthok", 1);
  assert.ok(before?.items.some((i) => i.id === newer));
  assert.equal((await listTopicSummaries()).topics.find((t) => t.slug === "orthok")?.latest?.title, `orthok 消息 2`);

  await sql`UPDATE publications SET visibility = 'withdrawn' WHERE article_id = ${newer}`;
  const page = await loadTopicPage("orthok", 1);
  assert.equal(page?.topic.latest?.title, `orthok 消息 1`, "the page's last update");
  assert.equal((await listTopicSummaries()).topics.find((t) => t.slug === "orthok")?.latest?.title, `orthok 消息 1`, "the index page's headline");
  assert.deepEqual(page?.items.map((i) => i.id), [older], "the list (rows were always checked again)");
});

test("a correction refreshes named content and its topic membership before the index expires", async () => {
  const title = `爱博医疗更正后的镜片消息 ${T}`;
  await overrideFields(corrected, { fields: { title }, version: 0, reason: "更正标题" }, "test-topics");
  const retitled = await loadTopicPage("eyebright", 1);
  assert.equal(retitled?.items[0]?.title, title, "the list");
  assert.equal(retitled?.topic.latest?.title, title, "the page headline");
  assert.equal((await listTopicSummaries()).topics.find((t) => t.slug === "eyebright")?.latest?.title, title, "the directory headline");

  await overrideFields(corrected, { fields: { category: "opinion" }, version: 1, reason: "实际是行业解读" }, "test-topics");
  const reclassified = await loadTopicPage("eyebright", 1);
  assert.equal(reclassified?.items[0]?.id, corrected, "it remains a selected report");

  await overrideFields(corrected, { fields: { tags: ["行业解读", "entity:euclid"] }, version: 2, reason: "更正主体公司" }, "test-topics");
  const moved = await loadTopicPage("eyebright", 1);
  assert.deepEqual(moved?.items, [], "the old topic list drops it");
  assert.equal(moved?.topic.latest, null, "the old topic headline drops it");
  assert.equal((await listTopicSummaries()).topics.find((t) => t.slug === "eyebright")?.latest, null, "the directory drops the old membership");
  assert.equal((await loadTopicPage("euclid", 1, new Date()))?.items[0]?.id, corrected, "the corrected membership is retained");
});

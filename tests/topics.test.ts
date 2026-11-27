// Topic pages: which articles a topic takes, and their counts.
// Written before the code, from the ways it can go wrong:
// - a company topic takes an article about another company that only mentions it (several subjects,
//   its name nowhere in the title), or drops one about it whose title names it in English, in another
//   case, next to Chinese text, or only by a product (it is the article's only subject);
// - a Latin name matches inside another word ("Euclidean" is not Euclid); a headline naming a company
//   that is not a subject of the article gets in;
// - a technical-direction topic stops taking its tags;
// - withdrawn or not yet released articles appear in a list or a count;
// - an article or story page names a topic its reports do not belong to;
// - an article page cannot tell which of its tags are a topic's own, so they link to filtered lists;
// - a topic without content has no page, or an unknown slug or a page past the end has one.
import { fact, mediaSource as MEDIA, officialSource as OFFICIAL, report, story, topicTag as T } from "./topic-fixtures.ts";
import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { closeDb, sql } from "@aihot/backend/db";
import { stopBoss } from "@aihot/backend/jobs/queue";
import { TOPICS, loadTopicPage, listTopicSummaries, topicsOfStory } from "@aihot/backend/publication/topics";
import { buildApp } from "../apps/api/src/app.ts";

const app = await buildApp();

before(async () => {
  await sql`INSERT INTO sources (id, name, kind, tier, participation_mode, next_fetch_at) VALUES
    (${OFFICIAL}, 'Official', 'rss', 'T1', 'editorial', '2100-01-01'),
    (${MEDIA}, 'Media', 'rss', 'T2', 'editorial', '2100-01-01')`;
});
after(async () => {
  await app.close();
  await stopBoss();
  await closeDb();
});

const hoursAgo = (h: number) => new Date(Date.now() - h * 3600_000);
const ids = (items: Array<{ id: string }>) => items.map((i) => i.id);
const page = async (slug: string, p = 1) => {
  const data = await loadTopicPage(slug, p, new Date());
  assert.ok(data, `${slug} page ${p}`);
  return data;
};
/** Every article of a topic, over all its pages. */
async function members(slug: string): Promise<string[]> {
  const first = await page(slug);
  const out = ids(first.items);
  for (let p = 2; p <= first.pageCount; p++) out.push(...ids((await page(slug, p)).items));
  return out;
}

test("a company topic takes the articles about it, not the ones that only mention it", async () => {
  const about = await report({ at: hoursAgo(30), title: `Menicon 推出镜片护理液 ${T}`, subjects: ["menicon"] });
  const product = await report({ at: hoursAgo(31), title: `新款护理液上市 ${T}`, subjects: ["menicon"] });
  const english = await report({ at: hoursAgo(32), title: `新品上市 ${T}`, originalTitle: `Menicon launches a lens care solution ${T}`, subjects: ["menicon", "coopervision"] });
  const subpoena = await report({ at: hoursAgo(33), title: `加州检察长向 CooperVision 发出传票 ${T}`, subjects: ["coopervision", "menicon", "orthok"] });
  const lowerCase = await report({ at: hoursAgo(34), title: `coopervision 公布新的护理液渠道 ${T}`, subjects: ["coopervision", "menicon"] });
  const pact = await report({ at: hoursAgo(35), title: `二十余家视光企业签署合作协议 ${T}`, subjects: ["coopervision", "menicon", "eyebright"] });
  const similarName = await report({ at: hoursAgo(36), title: `Euclidean 标准发布，CooperVision 参与 ${T}`, subjects: ["euclid", "coopervision"] });
  const adjacent = await report({ at: hoursAgo(37), title: `发布Euclid的新镜片 ${T}`, subjects: ["euclid", "coopervision"] });
  const headline = await report({ at: hoursAgo(38), title: `Menicon 被一篇盘点提到 ${T}`, subjects: ["eyebright"] });
  const lensCare = await report({ at: hoursAgo(39), title: `护理液发布 ${T}`, tags: ["护理液"] });

  const menicon = await members("menicon");
  for (const id of [about, product, english]) assert.ok(menicon.includes(id), "about Menicon");
  for (const id of [subpoena, lowerCase, pact, headline]) assert.ok(!menicon.includes(id), "only mentions Menicon");
  const coopervision = await members("coopervision");
  for (const id of [subpoena, lowerCase, similarName]) assert.ok(coopervision.includes(id), "about CooperVision");
  for (const id of [english, pact]) assert.ok(!coopervision.includes(id), "only mentions CooperVision");
  const euclid = await members("euclid");
  assert.ok(euclid.includes(adjacent), "Euclid next to Chinese text");
  assert.ok(!euclid.includes(similarName), "Euclidean is not Euclid");
  assert.ok((await members("lens-care")).includes(lensCare), "a technical direction takes its tag");

  // The article page names the topics it belongs to.
  const topicsOf = async (id: string) => {
    const res = await app.inject({ method: "GET", url: `/api/site/items/${id}` });
    return (JSON.parse(res.body) as { topics: Array<{ slug: string }> }).topics.map((t) => t.slug);
  };
  assert.deepEqual(await topicsOf(about), ["menicon", "launches"]);
  assert.deepEqual(await topicsOf(subpoena), ["coopervision", "launches"]);
  assert.deepEqual(await topicsOf(pact), ["launches"]);
  assert.deepEqual(await topicsOf(lensCare), ["lens-care", "launches"]);
});

test("an article page says which of its tags are a topic's own", async () => {
  // A direction's or a form's tags, and the tag cards show for a company (its subject tag is never shown).
  const id = await report({ at: hoursAgo(3), title: `目立康发布镜片护理液 ${T}`, subjects: ["menicon", "coopervision"], tags: ["护理液", "技术进展", "目立康", "库博光学", "渠道"] });
  const res = await app.inject({ method: "GET", url: `/api/site/items/${id}` });
  const body = JSON.parse(res.body) as { tags: string[]; tagTopics: Record<string, string>; topics: Array<{ slug: string }> };
  assert.deepEqual(body.tags, ["新品上市", "护理液", "技术进展", "目立康", "库博光学", "渠道"]);
  assert.deepEqual(body.tagTopics, { "新品上市": "launches", 护理液: "lens-care", "技术进展": "technology", 目立康: "menicon", 库博光学: "coopervision" });
  // The company its title does not name is a topic of the tag, not of the article.
  assert.deepEqual(body.topics.map((t) => t.slug), ["menicon", "lens-care", "launches", "technology"]);
});

test("renaming a company topic keeps its old full name usable for search", async () => {
  const id = await report({at: hoursAgo(2), title: `梦戴维新品上市 ${T}`, subjects: ['orthok'], selected: false});
  for (const query of ['欧普康视科技股份有限公司', '欧普康视']) {
    const res = await app.inject({method: 'GET', url: `/api/site/pool?q=${encodeURIComponent(query)}`});
    assert.equal(res.statusCode, 200);
    assert.ok(ids(JSON.parse(res.body).items).includes(id), 'full company names must still find subject-tagged reports');
  }
});

test("a story page names the topics of its reports", async () => {
  const launch = await story(`新款护理液上市 ${T}`);
  await report({ source: OFFICIAL, at: hoursAgo(26), title: `新款护理液上市 ${T}`, tags: ["护理液"], fact: await fact(launch.id, "发布 V2") });
  assert.deepEqual(await topicsOfStory(launch.id), [{ slug: "lens-care", name: "护理液" }, { slug: "launches", name: "竞品新品与获批" }]);
});

test("withdrawn articles stay out of lists and counts", async () => {
  const kept = await report({ at: hoursAgo(5), title: `博士伦发布护理液 ${T}`, subjects: ["bausch-lomb"] });
  const withdrawn = await report({ at: hoursAgo(4), title: `博士伦撤回的消息 ${T}`, subjects: ["bausch-lomb"] });
  await sql`UPDATE publications SET visibility = 'withdrawn' WHERE article_id = ${withdrawn}`;

  const data = await page("bausch-lomb");
  assert.deepEqual(ids(data.items), [kept]);
  assert.equal(data.topic.total, 1);
  const summary = (await listTopicSummaries()).topics.find((t) => t.slug === "bausch-lomb")!;
  assert.equal(summary.latest?.title, `博士伦发布护理液 ${T}`, "the index shows the newest public article");
});

test("every topic has a page; unknown topics and pages past the end have none", async () => {
  const empty = await page("exhibitions");
  assert.equal(empty.topic.indexable, false, "a topic without content is not indexed");
  assert.deepEqual(empty.items, []);
  assert.equal(await loadTopicPage("not-a-topic", 1, new Date()), null);
  assert.equal(await loadTopicPage("exhibitions", 2, new Date()), null);
  const index = await app.inject({ method: "GET", url: "/api/site/topics" });
  const body = JSON.parse(index.body) as { groups: Array<{ key: string }>; topics: Array<{ slug: string }> };
  assert.deepEqual(body.groups.map((g) => g.key), ["company", "field", "genre"]);
  assert.deepEqual(body.topics.map((t) => t.slug).sort(), TOPICS.map((t) => t.slug).sort(), "the index lists every topic");
});

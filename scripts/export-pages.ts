// Export public views for GitHub Pages. Content comes from the same publication layer as the API.
import { copyFile, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { config, REPO_ROOT } from "@aihot/backend/config";
import { closeDb } from "@aihot/backend/db";
import { loadItemDetail } from "@aihot/backend/publication/detail";
import { itemFeed, reportFeed } from "@aihot/backend/publication/feeds";
import { latestHotRanking } from "@aihot/backend/publication/hot";
import { loadPool } from "@aihot/backend/publication/pool";
import { listReports, loadReport } from "@aihot/backend/publication/reports";
import { loadTimeline } from "@aihot/backend/publication/timeline";
import { listTopicSummaries, loadTopicPage } from "@aihot/backend/publication/topics";
import { type FeedItemSummary, type ReportCitation } from "@aihot/contracts/site";
import { categoryLabel } from "@aihot/contracts/taxonomy";
import { CATEGORIES } from "@aihot/industry/taxonomy";
import { SITE } from "@aihot/site";

const output = path.resolve(process.argv[2] ?? "dist/pages");
const siteUrl = new URL(`${config.siteUrl}/`);
const base = siteUrl.pathname.replace(/\/$/, "");
const now = new Date();
const format = new Intl.DateTimeFormat("zh-CN", { timeZone: "Asia/Shanghai", dateStyle: "medium", timeStyle: "short" });
const date = (value: string | Date) => format.format(new Date(value));
const html = (value: string | number) => String(value).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
const url = (route: string) => html(`${base}${route}`);
const paragraph = (text: string | null | undefined) => text ? `<p>${html(text)}</p>` : "";
const message = (text: string) => `<p class="empty">${html(text)}</p>`;
const itemPath = (id: string) => `/items/${encodeURIComponent(id)}/`;
const topicPath = (slug: string) => `/topics/${encodeURIComponent(slug)}/`;

function original(href: string | null, label = "查看原文") {
  if (!href) return "";
  const link = URL.parse(href);
  return link && ["http:", "https:"].includes(link.protocol)
    ? `<a href="${html(link.href)}" rel="noopener noreferrer">${html(label)}</a>` : "";
}

async function write(file: string, content: string) {
  const target = path.join(output, file);
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, content, "utf8");
}

const navigation = [["/", "精选"], ["/all/", "全部动态"], ["/hot/", "热点榜"], ["/daily/", "日报"], ["/topics/", "主题"], ["/about/", "关于"]] as const;
async function page(route: string, title: string, body: string, section = route) {
  const canonical = new URL(route.slice(1), siteUrl).href;
  await write(`${route.slice(1)}index.html`, `<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${html(route === "/" ? SITE.homeTitle : `${title} · ${SITE.name}`)}</title><meta name="description" content="${html(SITE.description)}">
<link rel="canonical" href="${html(canonical)}"><link rel="icon" href="${url("/favicon.ico")}"><link rel="stylesheet" href="${url("/styles.css")}">
<link rel="alternate" type="application/rss+xml" title="${html(SITE.name)}" href="${url("/feed.xml")}"></head>
<body><a class="skip" href="#content">跳到正文</a><header class="masthead"><div class="wrap"><a class="brand" href="${url("/")}"><img src="${url("/logo.svg")}" alt="" width="36" height="36">${html(SITE.name)}</a>
<nav aria-label="主导航">${navigation.map(([href, label]) => `<a href="${url(href)}"${section === href ? ' aria-current="page"' : ""}>${label}</a>`).join("")}</nav></div></header>
<main id="content" class="wrap"><h1>${html(title)}</h1>${body}</main>
<footer class="wrap"><span>本页生成于 ${html(date(now))}（北京时间）</span><a href="${url("/feed.xml")}">RSS 订阅</a></footer></body></html>`);
}

const articles = new Set<string>();
function cards(items: FeedItemSummary[]) {
  if (!items.length) return message("这个栏目暂无已发布的资讯。");
  return `<div class="items">${items.map(item => {
    articles.add(item.id);
    const meta = [item.category && categoryLabel(item.category, "zh"), item.source.name, item.publishedAt && date(item.publishedAt)].filter(Boolean).join(" · ");
    return `<article><div class="meta">${html(meta)}</div><h2><a href="${url(itemPath(item.id))}">${html(item.title)}</a></h2>${paragraph(item.summary)}</article>`;
  }).join("")}</div>`;
}

function citations(items: ReportCitation[]) {
  return `<ul class="citations">${items.filter(i => i.available).map(i => `<li><strong>${html(i.title)}</strong>${paragraph(i.summary)}${original(i.sourceUrl, i.sourceName)}</li>`).join("")}</ul>`;
}

try {
  await mkdir(output, { recursive: true });
  for (const file of ["logo.svg", "favicon.ico"]) await copyFile(path.join(REPO_ROOT, "site/brand", file), path.join(output, file));
  await copyFile(path.join(REPO_ROOT, "deploy/pages.css"), path.join(output, "styles.css"));
  await write(".nojekyll", "");

  const filter = { channel: "all", category: null, tag: null, now } as const;
  const [timeline, ranking, topics, all] = await Promise.all([
    loadTimeline({ ...filter, limit: 40 }), latestHotRanking(), listTopicSummaries(), loadPool(filter),
  ]);
  const ranked = (take: number) => (ranking?.entries.length ? `<ol class="rank">${ranking.entries.slice(0, take).map(entry => {
    if (entry.representativeItemId) articles.add(entry.representativeItemId);
    const title = entry.representativeItemId ? `<a href="${url(itemPath(entry.representativeItemId))}">${html(entry.title)}</a>` : html(entry.title);
    return `<li>${title}<span class="meta">热度 ${html(entry.heat)}</span></li>`;
  }).join("")}</ol>` : message("最近 48 小时暂无上榜事件。"));
  await page("/", "精选", `<p class="intro">追踪角膜塑形镜、护理液、竞品推广、技术研究、学术会议与展会。</p><section class="spotlight"><h2>当前热点</h2>${ranked(5)}<a href="${url("/hot/")}">完整榜单</a></section>${cards(timeline.cards.map(card => card.item))}`);
  await page("/hot/", "热点榜", `<p class="intro">根据过去 48 小时报道同一事件的独立来源计算热度。</p>${ranked(40)}`);

  const filters = `<nav class="filters" aria-label="资讯分类"><a href="${url("/all/")}">全部</a>${CATEGORIES.map(c => `<a href="${url(`/category/${c.key}/`)}">${html(c.label)}</a>`).join("")}</nav>`;
  await page("/all/", "全部动态", filters + cards(all.items));
  for (const category of CATEGORIES) {
    const list = await loadPool({ ...filter, category: category.key });
    await page(`/category/${category.key}/`, category.label, filters + cards(list.items), "/all/");
  }

  await page("/topics/", "主题", topics.groups.map(group => `<section><h2>${html(group.name)}</h2><p class="intro">${html(group.blurb)}</p><div class="topics">${topics.topics.filter(t => t.group === group.key).map(t => `<a href="${url(topicPath(t.slug))}"><strong>${html(t.name)}</strong>${paragraph(t.definition)}</a>`).join("")}</div></section>`).join(""));
  for (const topic of topics.topics) {
    const detail = await loadTopicPage(topic.slug, 1, now);
    await page(topicPath(topic.slug), topic.name, paragraph(topic.definition) + cards(detail?.items ?? []), "/topics/");
  }

  for (const [kind, label] of [["daily", "日报"], ["weekly", "周报"], ["monthly", "月报"]] as const) {
    const archive = await listReports(kind, 40);
    const editionNav = `<nav class="filters" aria-label="期刊类型">${[["daily", "日报"], ["weekly", "周报"], ["monthly", "月报"]].map(([key, name]) => `<a href="${url(`/${key}/`)}">${name}</a>`).join("")}</nav>`;
    await page(`/${kind}/`, label, editionNav + (archive.length ? `<ul class="citations">${archive.map(issue => `<li><a href="${url(`/${kind}/${encodeURIComponent(issue.key)}/`)}">${html(issue.key)} · ${html(issue.title ?? label)}</a></li>`).join("")}</ul>` : message(`暂无已发布的${label}。`)), "/daily/");
    for (const issue of archive) {
      const report = await loadReport(kind, issue.key);
      if (!report) throw new Error(`Issue disappeared during export: ${kind}/${issue.key}`);
      const lead = report.lead ? paragraph(report.lead.leadParagraph) : "";
      const sections = report.sections.map(s => `<section><h2>${html(s.label)}</h2>${paragraph(s.summary)}${citations(s.items)}</section>`).join("");
      await page(`/${kind}/${encodeURIComponent(issue.key)}/`, report.title, `<p class="meta">${html(issue.key)} · 第 ${issue.issueNumber} 期</p>${editionNav}${lead}${paragraph(report.overview)}${sections}${report.flashes.length ? `<section><h2>简讯</h2>${citations(report.flashes)}</section>` : ""}`, "/daily/");
    }
  }

  for (const id of articles) {
    const detail = await loadItemDetail(id, "zh", now);
    if (detail.kind !== "found") throw new Error(`Article disappeared during export: ${id}`);
    const { item } = detail;
    const meta = [item.source.name, item.publishedAt && date(item.publishedAt)].filter(Boolean).join(" · ");
    await page(itemPath(id), item.title, `<div class="meta">${html(meta)}</div><div class="reading">${paragraph(item.summary)}${item.reason ? `<p><strong>关注理由</strong> ${html(item.reason)}</p>` : ""}<p>${original(item.links.original)}</p></div>`);
  }

  await page("/about/", "关于", `<div class="reading">${paragraph(SITE.description)}<p>网站定时发布公开信源的摘要与原文链接。产品批准、临床研究和活动安排请以监管机构、研究原文或主办方公告为准。</p><p><a href="${url("/feed.xml")}">精选 RSS</a> · <a href="${url("/daily.xml")}">日报 RSS</a></p></div>`);
  await write("feed.xml", await itemFeed("selected", null));
  await write("daily.xml", await reportFeed("daily"));
  console.log(`Exported ${articles.size} article pages to ${output}`);
} finally {
  await closeDb();
}

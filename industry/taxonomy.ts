// 这个行业的分类体系：类别、标签词表、公司（主体）名录，以及防止张冠李戴的身份词典。
// 模型按这里的词表打标签，主题页（topics.json）按标签归类，筛选栏按类别分组。
// 换行业时：类别的 key 会出现在网址里（/all?category=…），上线后就不要再改；标签和名录可以随时增减。

/**
 * 网页上的类别（筛选栏、卡片角标、RSS 分类订阅）。key 是网址和接口里的身份，上线后不要改。
 * section 是日报里的分节标题（几个类别可以共用一节，按这里的顺序排）；guide 告诉结构抽取模型这一类收什么、
 * 和相邻类别的边界在哪（总的归类原则写在 prompts/structure.md 里）。
 * commentary 标出评论类（教程、观点）：日报写过的事又有评论类的后续报道，只占一行快讯（报道它的信源够多时除外）。
 * 没归上类的资料在日报里放进第一个 key 为 industry 的类别所在的节（没有就放最后一节）。
 * tagColor 是飞书推送卡片里跟在标题后面的这一类小标签的颜色（飞书 text_tag 的颜色名）。
 * feedLabel 是分类 RSS 标题里的名字（不写就用 label）。公开接口、RSS 和 MCP 里要把一类并进另一类发布，写在站点设置里（site/site.ts 的 PUBLIC_CATEGORIES）。
 */
export const CATEGORIES = [
  { key: "product-launches", tagColor: "indigo", label: "新品与获批", section: "新品与获批", guide: "角膜塑形镜、护理液与相关器械的新品、上市、获批、规格和适用范围变化。法规变化及召回归行业与监管。" },
  { key: "market", tagColor: "turquoise", label: "市场与渠道", section: "市场与渠道", guide: "针对相关产品的竞品推广、渠道合作、验配中心拓展、专业培训推广和商业化动作。" },
  { key: "paper", tagColor: "violet", label: "技术与研究", section: "技术与研究", guide: "镜片设计与材料、护理技术、验配设备、临床研究、新工艺和有数据的技术验证。" },
  { key: "conferences", tagColor: "green", label: "学术会议", section: "会议与展会", guide: "以专题议程、学术报告、征稿、培训或指南发布为重点的会议动态。研讨会公布的独立研究结果可归技术与研究。" },
  { key: "exhibitions", tagColor: "purple", label: "行业展会", section: "会议与展会", guide: "眼视光及接触镜相关展会的档期、展区、参展商、展品和报名；展会上独立发布的新品可归新品与获批。" },
  { key: "industry", tagColor: "orange", label: "行业与监管", section: "行业与监管", guide: "监管、标准、召回、供应链、企业经营与行业趋势，需有可说明的眼视光业务关联。" },
  { key: "opinion", tagColor: "grey", label: "行业解读", section: "行业解读", guide: "以分析、方法分享、专家解读或访谈为主，具体临床研究结果归技术与研究。", commentary: true },
] as const satisfies ReadonlyArray<{ key: string; tagColor: string; label: string; feedLabel?: string; section: string; guide: string; commentary?: true }>;

export const RELEASE: { category: string; tag: string; unit: string } | null = { category: "product-launches", tag: "新品上市", unit: "款新品" };

export const PLAIN_TERMS: readonly string[] = ["ok", "rgp", "d", "mm", "nmpa", "fda", "ce"];

export const ITEM_TYPES = ["product_launch", "market_activity", "exhibition", "research_paper", "industry_event", "opinion_analysis", "academic_conference"] as const;

export const CATEGORY_TAGS = [
  "新品上市", "产品获批", "产品更新", "市场推广", "渠道合作", "论文/研究", "技术进展",
  "学术会议", "行业展会", "政策/监管", "安全/召回", "行业动态", "行业解读", "其他",
] as const;

export const TOPIC_TAGS = [
  "角膜塑形镜", "护理液", "硬性接触镜", "近视管理", "验配设备", "镜片材料", "镜片设计", "临床证据",
] as const;

export const ENTITY_TAGS = ["目立康", "欧普康视", "爱博医疗", "库博光学", "博士伦", "Euclid", "蔡司"] as const;

export const TAG_SYNONYMS: Readonly<Record<string, string>> = {
  "OK镜": "角膜塑形镜", "OK 镜": "角膜塑形镜", "Ortho-K": "角膜塑形镜", RGP: "硬性接触镜",
  "接触镜护理液": "护理液", "隐形眼镜护理液": "护理液", "近视防控": "近视管理",
  论文: "论文/研究", 研究: "论文/研究", 政策: "政策/监管", 监管: "政策/监管",
  新品: "新品上市", 注册获批: "产品获批", 展会: "行业展会", 召回: "安全/召回",
};

export const TAG_DISPLAY: Readonly<Record<string, string | null>> = {
  "论文/研究": "研究",
  "政策/监管": "监管",
  "安全/召回": "安全与召回",
  其他: null,
};

export const ENTITIES: Record<string, { name: string; displayTag: string | null; aliases: string[]; orgNames?: string[]; otherNames?: string[] }> = {
  menicon: { name: "目立康", displayTag: "目立康", aliases: ["目立康", "Menicon", "大连目立康"], orgNames: ["目立康", "Menicon", "大连目立康"] },
  orthok: { name: "欧普康视", displayTag: "欧普康视", aliases: ["欧普康视", "梦戴维", "欧普康视科技股份有限公司"], orgNames: ["欧普康视", "欧普康视科技股份有限公司"] },
  eyebright: { name: "爱博医疗", displayTag: "爱博医疗", aliases: ["爱博医疗", "爱博诺德", "Eyebright Medical", "普诺瞳"], orgNames: ["爱博医疗", "爱博诺德"] },
  coopervision: { name: "库博光学", displayTag: "库博光学", aliases: ["库博光学", "CooperVision", "Paragon CRT"], orgNames: ["库博光学", "CooperVision"] },
  "bausch-lomb": { name: "博士伦", displayTag: "博士伦", aliases: ["博士伦", "Bausch + Lomb", "Bausch & Lomb", "Boston Simplus"], orgNames: ["博士伦", "Bausch + Lomb"] },
  euclid: { name: "Euclid", displayTag: "Euclid", aliases: ["美国欧几里得", "欧几里得角膜塑形镜", "Euclid Vision", "Euclid Systems", "Euclid Ortho-K"], orgNames: ["Euclid Vision", "Euclid Systems"] },
  zeiss: { name: "蔡司", displayTag: "蔡司", aliases: ["蔡司", "蔡司光学", "ZEISS", "ZEISS Vision Care", "Carl Zeiss"], orgNames: ["蔡司光学", "ZEISS Vision Care", "Carl Zeiss"] },
};

export const IDENTITY_LEXICON: ReadonlyArray<{ id: string; name: string; patterns: RegExp[] }> = [
  { id: "menicon", name: "目立康", patterns: [/目立康|\bmenicon\b/i] },
  { id: "orthok", name: "欧普康视", patterns: [/欧普康视|梦戴维/] },
  { id: "eyebright", name: "爱博医疗", patterns: [/爱博医疗|爱博诺德|普诺瞳|\beyebright medical\b/i] },
  { id: "coopervision", name: "库博光学", patterns: [/库博光学|\bcoopervision\b|\bparagon crt\b/i] },
  { id: "bausch-lomb", name: "博士伦", patterns: [/博士伦|\bbausch\s*(?:[+&]|and)\s*lomb\b|\bboston simplus\b/i] },
  { id: "euclid", name: "Euclid", patterns: [/美国欧几里得|欧几里得角膜塑形镜|\beuclid (?:vision|systems|ortho-?k)\b/i] },
  { id: "zeiss", name: "蔡司", patterns: [/蔡司|\bzeiss\b/i] },
];

export const PUBLISHER_DOMAINS: ReadonlyArray<{ entityId: string; domains: readonly string[] }> = [
  { entityId: "menicon", domains: ["menicon.com"] },
  { entityId: "orthok", domains: ["orthok.cn"] },
  { entityId: "eyebright", domains: ["ebmedical.com"] },
  { entityId: "coopervision", domains: ["coopervision.com"] },
  { entityId: "bausch-lomb", domains: ["bausch.com", "bauschcontactlenses.com"] },
  { entityId: "euclid", domains: ["euclidlenses.com"] },
  { entityId: "zeiss", domains: ["zeiss.com", "zeiss.com.cn"] },
];

export const IDENTITY_CONTEXT_ALIASES: ReadonlyArray<{ entityId: string; pattern: RegExp }> = [];

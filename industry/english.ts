// English labels for public outlets. Keys match the industry taxonomy and topic directory.
import type { CATEGORIES } from "./taxonomy.ts";

type CategoryKey = (typeof CATEGORIES)[number]["key"];

export const CATEGORY_EN: Record<CategoryKey, { label: string; feedLabel: string; section: string }> = {
  "product-launches": { label: "New products & approvals", feedLabel: "New products & approvals", section: "New products & approvals" },
  market: { label: "Markets & channels", feedLabel: "Markets & channels", section: "Markets & channels" },
  paper: { label: "Technology & research", feedLabel: "Technology & research", section: "Technology & research" },
  conferences: { label: "Academic meetings", feedLabel: "Academic meetings", section: "Meetings & exhibitions" },
  exhibitions: { label: "Trade exhibitions", feedLabel: "Trade exhibitions", section: "Meetings & exhibitions" },
  industry: { label: "Industry & regulation", feedLabel: "Industry & regulation", section: "Industry & regulation" },
  opinion: { label: "Industry analysis", feedLabel: "Industry analysis", section: "Industry analysis" },
};

export const TAG_EN: Record<string, string> = {
  新品上市: "New launches", 产品获批: "Product approvals", 产品更新: "Product updates", 市场推广: "Marketing", 渠道合作: "Channel partnerships",
  "论文/研究": "Research", 研究: "Research", 技术进展: "Technology", 学术会议: "Academic meetings", 行业展会: "Trade exhibitions",
  "政策/监管": "Regulation", 监管: "Regulation", "安全/召回": "Safety & recalls", 安全与召回: "Safety & recalls",
  行业动态: "Industry news", 行业解读: "Industry analysis", 其他: "Other",
  角膜塑形镜: "Orthokeratology lenses", 护理液: "Lens care solutions", 硬性接触镜: "Rigid contact lenses", 近视管理: "Myopia management",
  验配设备: "Lens fitting equipment", 镜片材料: "Lens materials", 镜片设计: "Lens design", 临床证据: "Clinical evidence",
  目立康: "Menicon", 欧普康视: "OVCTEK", 爱博医疗: "Eyebright Medical", 库博光学: "CooperVision", 博士伦: "Bausch + Lomb", Euclid: "Euclid", 蔡司: "ZEISS",
};

export const TOPIC_EN: Record<string, { name: string; definition: string }> = {
  menicon: { name: "Menicon", definition: "Public product, technology and business developments from Menicon." },
  orthok: { name: "OVCTEK", definition: "Orthokeratology products, rigid lens care and sales channels." },
  eyebright: { name: "Eyebright Medical", definition: "Orthokeratology and myopia management updates." },
  coopervision: { name: "CooperVision", definition: "Products, clinical research and market activity in orthokeratology and myopia management." },
  "bausch-lomb": { name: "Bausch + Lomb", definition: "Developments in rigid lens care and related contact lens products." },
  euclid: { name: "Euclid", definition: "Orthokeratology products, research and sales channels." },
  zeiss: { name: "ZEISS", definition: "Myopia management, orthokeratology, clinical research and lens fitting equipment." },
  orthokeratology: { name: "Orthokeratology lenses", definition: "Lens design, development, approvals, launches and fitting." },
  "lens-care": { name: "Lens care solutions", definition: "Cleaning, disinfection, storage and protein removal products for rigid lenses and orthokeratology." },
  fitting: { name: "Lens fitting equipment", definition: "Corneal topography, measurement tools and fitting equipment." },
  clinical: { name: "Clinical research", definition: "Clinical evidence on lenses, care products and myopia management." },
  myopia: { name: "Myopia management", definition: "Orthokeratology and related myopia management options." },
  launches: { name: "New products & approvals", definition: "Product launches, regulatory approvals and specification changes." },
  promotion: { name: "Marketing & channels", definition: "Marketing campaigns, practitioner training, partnerships and distribution." },
  technology: { name: "Technology", definition: "Lens design, materials, manufacturing and fitting technology." },
  conferences: { name: "Academic meetings", definition: "Topics, programmes and calls for abstracts in optometry and specialty lenses." },
  exhibitions: { name: "Trade exhibitions", definition: "Trade show schedules, exhibits and exhibitors." },
  regulation: { name: "Regulation & recalls", definition: "Registration, safety, compliance and product recalls." },
};

export const TOPIC_GROUP_EN: Record<string, { name: string; blurb: string }> = {
  company: { name: "Companies & brands", blurb: "Public developments from Menicon and other industry companies." },
  field: { name: "Products & technology", blurb: "Orthokeratology, lens care, fitting and clinical research." },
  genre: { name: "Industry developments", blurb: "Launches, marketing, regulation, meetings and trade shows." },
};

export const RELEASE_UNIT_EN = { one: "new product", many: "new products" };

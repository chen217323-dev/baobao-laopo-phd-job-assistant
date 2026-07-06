import fs from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "../..");
const OUT_DIR = path.join(ROOT, "outputs");
const APP_DIR = path.join(OUT_DIR, "app");
const CONFIG_PATH = path.join(import.meta.dirname, "sources.json");
const TODAY = new Date().toISOString().slice(0, 10);

const config = JSON.parse(await fs.readFile(CONFIG_PATH, "utf8"));

function decodeEntities(value = "") {
  return value
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function cleanText(value = "") {
  return decodeEntities(value)
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function pageText(html = "") {
  return cleanText(html).slice(0, 20000);
}

function extractTitle(html = "", fallback = "") {
  const h1 = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1];
  const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1];
  return cleanText(h1 || title || fallback).replace(/[-_|].*$/, "").trim() || fallback;
}

function absolutize(href, base) {
  try {
    return new URL(href, base).href;
  } catch {
    return "";
  }
}

async function fetchText(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20000);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "user-agent": "Mozilla/5.0 (compatible; BaobaoPhDJobAssistant/0.1; +local-prototype)",
        "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
      }
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.text();
  } finally {
    clearTimeout(timer);
  }
}

function extractLinks(html, baseUrl, source) {
  const links = [];
  const keywordPattern = new RegExp(source.linkKeywords.join("|"), "i");
  for (const match of html.matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)) {
    const url = absolutize(match[1], baseUrl);
    const title = cleanText(match[2]);
    if (!url || !title || title.length < 4) continue;
    if (!keywordPattern.test(`${title} ${url}`)) continue;
    if (/\.(jpg|png|gif|pdf|zip|rar|docx?|xlsx?)($|\?)/i.test(url)) continue;
    if (/javascript:|#|\/vip\/|\/about\/|\/user\/|\/company\//i.test(url)) continue;
    if (/\/job\?|\/news\/|zhaopinhui\.gaoxiaojob\.com/i.test(url)) continue;
    links.push({ url, title });
  }
  const seen = new Set();
  return links.filter((link) => {
    if (seen.has(link.url)) return false;
    seen.add(link.url);
    return true;
  }).slice(0, source.maxLinks || 40);
}

function isLikelyListPage(url, title) {
  return /\/column\/|\/zhuanti\/|\/special\/|\/category\//i.test(url)
    || /栏目|频道|专区|专栏|列表|招聘信息频道|首页$/.test(title);
}

function isLikelyDetailPage(url, title) {
  if (isLikelyListPage(url, title)) return false;
  if (/gaoxiaojob\.com/i.test(url)) return /\/announcement\/detail\//i.test(url);
  if (/\/announcement\/|\/zhaopin\/|\/article\/|\/detail\//i.test(url)) return true;
  if (/招聘|招收|诚聘|引进|博士后|教师|研究员|科研|人才/.test(title) && title.length >= 10) return true;
  return false;
}

function findFirst(text, patterns) {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) return match[1].trim();
  }
  return "";
}

function extractEmail(text) {
  return text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] || "";
}

function extractPhone(text) {
  return text.match(/(?:\+?\d{1,3}[- ]?)?(?:0\d{2,3}[- ]?)?\d{7,8}/)?.[0] || "";
}

function inferOrg(title, text, category) {
  const titleOrg = title.match(/^([\u4e00-\u9fa5A-Za-z ]{2,36}?(?:大学|学院|研究院|医院|中心|实验室|银行|集团|公司|University|Institute|College|Lab|Research))/i)?.[1];
  if (titleOrg) return titleOrg.trim();
  const knownOrg = findFirst(`${title} ${text}`, [
    /([\u4e00-\u9fa5A-Za-z ]{2,40}(?:大学|学院|研究院|医院|中心|实验室|University|Institute|College|Lab|Research))/i,
    /([\u4e00-\u9fa5A-Za-z ]{2,40}(?:有限公司|集团|科技|Research|AI Lab|Samsung|LG|NAVER|Kakao))/i
  ]);
  if (knownOrg) return knownOrg.replace(/^招聘|^诚聘/, "").trim();
  return category === "中国高校" ? "待从原文确认的高校" : category === "中国公司" ? "待从原文确认的公司" : "待从原文确认的韩国单位";
}

function sliceAround(text, keywords, max = 360) {
  const index = keywords.map((keyword) => text.indexOf(keyword)).filter((item) => item >= 0).sort((a, b) => a - b)[0];
  if (index == null) return "";
  return text.slice(index, index + max);
}

function makeJob({ category, source, link, html }) {
  const text = pageText(html);
  let title = extractTitle(html, link.title);
  if (title.length < 8 || /站$|首页$|栏目$/.test(title)) title = link.title;
  const org = inferOrg(title, text, category);
  const orgLine = `${title} ${org}`;
  const finalCategory = /大学|学院|医院|学校|职业技术学院/.test(orgLine)
    ? "中国高校"
    : /银行|公司|集团|有限公司|股份/.test(orgLine) && category === "中国高校"
      ? "中国公司"
      : category;
  const deadline = findFirst(text, [
    /截止(?:时间|日期)?[：:\s]*([0-9]{4}[年.-][0-9]{1,2}[月.-][0-9]{1,2}日?)/,
    /报名时间[：:\s]*[^。；;]{0,40}至\s*([0-9]{4}[年.-][0-9]{1,2}[月.-][0-9]{1,2}日?)/,
    /deadline[：:\s]*([A-Za-z0-9, .-]{5,30})/i
  ]) || "公告未明确";
  const email = extractEmail(text);
  const phone = extractPhone(text);
  const requirements = [
    sliceAround(text, ["任职要求", "应聘条件", "招聘条件", "Qualifications"], 420),
    sliceAround(text, ["博士", "PhD"], 300)
  ].filter(Boolean);
  const benefits = [
    sliceAround(text, ["待遇", "薪酬", "安家费", "科研启动", "Benefits", "Salary"], 420)
  ].filter(Boolean);
  const materials = [
    sliceAround(text, ["申请材料", "应聘材料", "提交材料", "Required documents"], 360)
  ].filter(Boolean);

  return {
    id: `job-${Buffer.from(link.url).toString("base64url").slice(0, 18)}`,
    type: finalCategory,
    title,
    org,
    department: findFirst(text, [/([\u4e00-\u9fa5A-Za-z ]{2,30}(?:学院|系|中心|实验室|Lab|Department|Center))/i]) || "公告未明确",
    city: findFirst(text, [/(?:工作地点|地点|Location)[：:\s]*([\u4e00-\u9fa5A-Za-z ]{2,30})/i]) || "公告未明确",
    source: source.name,
    sourceUrl: link.url,
    publishDate: findFirst(text, [/([0-9]{4}[年.-][0-9]{1,2}[月.-][0-9]{1,2}日?)/]) || TODAY,
    deadline,
    deadlineText: deadline,
    score: finalCategory === "中国高校" ? 86 : finalCategory === "中国公司" ? 80 : 76,
    urgent: /[0-9]{4}[年.-][0-9]{1,2}[月.-][0-9]{1,2}/.test(deadline),
    reason: "真实网页抓取结果。请打开原文核对最终条件、待遇和截止日期。",
    requirements: requirements.length ? requirements : ["公告正文已保存，具体条件请查看原文详情。"],
    benefits: benefits.length ? benefits : ["公告未解析出明确待遇，需查看原文确认。"],
    materials: materials.length ? materials : ["公告未解析出完整材料清单，需查看原文确认。"],
    contact: {
      name: email ? "公告联系人" : "公告未解析出联系人",
      email,
      phone
    },
    method: email ? `可按公告要求联系或发送材料至 ${email}` : "请打开原文查看投递方式。",
    rawText: text.slice(0, 5000),
    crawledAt: new Date().toISOString(),
    isRealCrawled: true
  };
}

async function crawlSource(source) {
  const html = await fetchText(source.url);
  const firstLinks = extractLinks(html, source.url, source);
  let links = firstLinks.filter((link) => isLikelyDetailPage(link.url, link.title));
  const listLinks = firstLinks.filter((link) => isLikelyListPage(link.url, link.title)).slice(0, 12);
  if (source.followListPages) {
    for (const listLink of listLinks) {
      try {
        const listHtml = await fetchText(listLink.url);
        links.push(...extractLinks(listHtml, listLink.url, source).filter((link) => isLikelyDetailPage(link.url, link.title)));
        await new Promise((resolve) => setTimeout(resolve, 250));
      } catch (error) {
        console.warn(`list failed: ${listLink.url} ${error.message}`);
      }
    }
  }
  links = dedupeLinks(links).slice(0, source.maxLinks || 40);
  const jobs = [];
  for (const link of links) {
    try {
      const detailHtml = await fetchText(link.url);
      jobs.push(makeJob({ category: source.category, source, link, html: detailHtml }));
      await new Promise((resolve) => setTimeout(resolve, 350));
    } catch (error) {
      console.warn(`detail failed: ${link.url} ${error.message}`);
    }
  }
  return jobs;
}

function dedupeLinks(links) {
  const seen = new Set();
  return links.filter((link) => {
    if (seen.has(link.url)) return false;
    seen.add(link.url);
    return true;
  });
}

function dedupe(jobs) {
  const seen = new Set();
  return jobs.filter((job) => {
    const key = job.sourceUrl || `${job.org}-${job.title}-${job.deadline}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function capByTarget(jobs) {
  const counts = {};
  return jobs.filter((job) => {
    const target = config.targets[job.type] || 20;
    counts[job.type] = counts[job.type] || 0;
    if (counts[job.type] >= target) return false;
    counts[job.type] += 1;
    return true;
  });
}

const allJobs = [];
for (const source of config.sources) {
  try {
    console.log(`crawl ${source.name}`);
    allJobs.push(...await crawlSource(source));
  } catch (error) {
    console.warn(`source failed: ${source.name} ${error.message}`);
  }
}

const jobs = capByTarget(dedupe(allJobs));
const payload = {
  generatedAt: new Date().toISOString(),
  note: "真实网页抓取结果；投递前仍需打开原文核对。",
  jobs
};

await fs.mkdir(OUT_DIR, { recursive: true });
await fs.mkdir(APP_DIR, { recursive: true });
await fs.writeFile(path.join(OUT_DIR, "jobs.json"), JSON.stringify(payload, null, 2), "utf8");
await fs.writeFile(
  path.join(OUT_DIR, "jobs-data.js"),
  `window.REAL_JOBS_PAYLOAD = ${JSON.stringify(payload, null, 2)};\n`,
  "utf8"
);
await fs.writeFile(path.join(APP_DIR, "jobs.json"), JSON.stringify(payload, null, 2), "utf8");
await fs.writeFile(
  path.join(APP_DIR, "jobs-data.js"),
  `window.REAL_JOBS_PAYLOAD = ${JSON.stringify(payload, null, 2)};\n`,
  "utf8"
);

console.log(`saved ${jobs.length} jobs`);

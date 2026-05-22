import { getCollection } from "astro:content";
import { postSlug } from "../../content/index.ts";
import { SITE } from "../../site.config.ts";
import { Resvg } from "@resvg/resvg-js";

const W = 1200;
const H = 630;
const FONT = "Microsoft YaHei, PingFang SC, Noto Sans SC, sans-serif";

function wrapText(text: string, maxChars: number): string[] {
  const lines: string[] = [];
  let cur = "";
  for (const ch of text) {
    if (cur.length >= maxChars) {
      lines.push(cur);
      cur = "";
    }
    cur += ch;
  }
  if (cur) lines.push(cur);
  return lines.slice(0, 2);
}

function ogSvg(title: string, subtitle: string): string {
  const titleLines = wrapText(title, 18);
  const titleEls = titleLines
    .map(
      (line, i) =>
        `<text x="80" y="${170 + i * 80}" font-size="64" font-weight="700" fill="#f1f5f9" font-family="${FONT}">${escapeXml(line)}</text>`,
    )
    .join("");

  const subLines = wrapText(subtitle, 32);
  const subY = 170 + titleLines.length * 80 + 20;
  const subEls = subLines
    .map(
      (line, i) =>
        `<text x="80" y="${subY + i * 44}" font-size="32" fill="#94a3b8" font-family="${FONT}">${escapeXml(line)}</text>`,
    )
    .join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#1e293b"/>
      <stop offset="100%" stop-color="#0f172a"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  ${titleEls}
  ${subEls}
  <text x="${W - 80}" y="${H - 80}" font-size="24" fill="#64748b" font-family="${FONT}" text-anchor="end">${escapeXml(SITE.title)}</text>
</svg>`;
}

function escapeXml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function renderPng(svg: string): Buffer {
  return new Resvg(svg, { font: { loadSystemFonts: true } }).render().asPng();
}

export async function getStaticPaths() {
  const posts = await getCollection("blog");
  return posts
    .filter((p) => !p.data.draft)
    .map((p) => ({ params: { slug: postSlug(p) } }));
}

export async function GET({ params }: { params: { slug: string } }) {
  try {
    const posts = await getCollection("blog");
    const post = posts.find((p) => postSlug(p) === params.slug);

    const title = post ? post.data.title : "404";
    const desc = post ? post.data.description : "Page not found";
    const png = renderPng(ogSvg(title, desc));

    return new Response(png, {
      headers: { "Content-Type": "image/png", "Cache-Control": "public, max-age=86400" },
    });
  } catch {
    return new Response(null, { status: 500 });
  }
}

import { Resvg } from "@resvg/resvg-js";
import { SITE } from "../../site.config.ts";

const W = 1200;
const H = 630;
const FONT = "Microsoft YaHei, PingFang SC, Noto Sans SC, sans-serif";

function escapeXml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function ogSvg(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#1e293b"/>
      <stop offset="100%" stop-color="#0f172a"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <text x="${W / 2}" y="${H / 2 - 30}" font-size="72" font-weight="700" fill="#f1f5f9" font-family="${FONT}" text-anchor="middle">${escapeXml(SITE.title)}</text>
  <text x="${W / 2}" y="${H / 2 + 40}" font-size="36" fill="#94a3b8" font-family="${FONT}" text-anchor="middle">${escapeXml(SITE.description)}</text>
</svg>`;
}

export async function GET() {
  try {
    const png = new Resvg(ogSvg(), { font: { loadSystemFonts: true } }).render().asPng();
    return new Response(png, {
      headers: { "Content-Type": "image/png", "Cache-Control": "public, max-age=86400" },
    });
  } catch {
    return new Response(null, { status: 500 });
  }
}

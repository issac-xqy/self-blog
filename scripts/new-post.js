import { writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const title = process.argv.slice(2).join(" ") || "新文章";
const today = new Date().toISOString().split("T")[0];
const slug = title
  .replace(/[^\w一-鿿]+/g, "-")
  .replace(/^-|-$/g, "")
  .toLowerCase();

const content = `---
title: "${title}"
description: ""
pubDate: ${today}
tags: []
---

`;

const filePath = join(__dirname, "..", "src", "content", "blog", `${slug}.mdx`);
writeFileSync(filePath, content, "utf-8");
console.log(`Created: src/content/blog/${slug}.mdx`);

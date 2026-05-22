import rss from "@astrojs/rss";
import { getAllPosts, postSlug } from "../content/index.ts";
import { SITE } from "../site.config.ts";

export async function GET(context: { site: URL }) {
  const posts = await getAllPosts();

  return rss({
    title: SITE.title,
    description: SITE.description,
    site: context.site.href,
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.pubDate,
      link: `/blog/${postSlug(post)}/`,
    })),
    customData: `<language>${SITE.language}</language>`,
  });
}

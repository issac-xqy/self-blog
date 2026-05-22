import { getCollection, type CollectionEntry } from "astro:content";

export type Post = CollectionEntry<"blog">;

/** Strip the file extension from a content collection ID to get a clean slug. */
export function postSlug(post: Post): string {
  return post.id.replace(/\.(?:md|mdx)$/, "");
}

/** Convert a raw tag to a URL-safe slug. */
export function tagSlug(tag: string): string {
  return tag.toLowerCase().replace(/[^a-z0-9一-鿿]+/g, "-").replace(/^-|-$/g, "");
}

/** All published posts, sorted by date descending. */
export async function getAllPosts(): Promise<Post[]> {
  const posts = await getCollection("blog");
  return posts
    .filter((p) => !p.data.draft)
    .sort((a, b) => b.data.pubDate.getTime() - a.data.pubDate.getTime());
}

/** Aggregated tag list with post counts. */
export async function getAllTags(): Promise<{ tag: string; count: number }[]> {
  const posts = await getAllPosts();
  const map = new Map<string, number>();
  for (const post of posts) {
    for (const tag of post.data.tags) {
      map.set(tag, (map.get(tag) ?? 0) + 1);
    }
  }
  return [...map.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => a.tag.localeCompare(b.tag));
}

/** Posts filtered by tag. Matches on URL-safe slug. */
export async function getPostsByTag(tag: string): Promise<Post[]> {
  const posts = await getAllPosts();
  const target = tagSlug(tag);
  return posts.filter((p) =>
    p.data.tags.some((t) => tagSlug(t) === target),
  );
}

/** Simple tag-overlap-based related posts (excludes current). */
export async function getRelatedPosts(
  current: Post,
  limit = 3,
): Promise<Post[]> {
  const posts = await getAllPosts();
  const currentTags = new Set(current.data.tags.map((t) => t.toLowerCase()));

  return posts
    .filter((p) => p.id !== current.id)
    .map((p) => ({
      post: p,
      overlap: p.data.tags.filter((t) => currentTags.has(t.toLowerCase()))
        .length,
    }))
    .filter((e) => e.overlap > 0)
    .sort((a, b) => b.overlap - a.overlap || b.post.data.pubDate.getTime() - a.post.data.pubDate.getTime())
    .slice(0, limit)
    .map((e) => e.post);
}

export async function onRequest({ env }) {
  const hasId = !!env.OAUTH_CLIENT_ID;
  const hasSecret = !!env.OAUTH_CLIENT_SECRET;
  const idPreview = hasId
    ? env.OAUTH_CLIENT_ID.slice(0, 8) + "…" + env.OAUTH_CLIENT_ID.slice(-4)
    : "未设置";
  const secretLen = hasSecret ? env.OAUTH_CLIENT_SECRET.length : 0;

  return new Response(
    JSON.stringify(
      {
        OAUTH_CLIENT_ID: idPreview,
        OAUTH_CLIENT_SECRET: hasSecret ? `已设置 (${secretLen} 字符)` : "未设置",
        base_url: "https://self-blog-88t.pages.dev",
        auth_url: "https://self-blog-88t.pages.dev/auth",
        callback_url: "https://self-blog-88t.pages.dev/callback",
      },
      null,
      2,
    ),
    {
      headers: { "Content-Type": "application/json" },
    },
  );
}

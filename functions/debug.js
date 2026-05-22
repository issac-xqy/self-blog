export async function onRequest({ env }) {
  const hasId = !!env.OAUTH_CLIENT_ID;
  const hasSecret = !!env.OAUTH_CLIENT_SECRET;

  // Try a credential check against GitHub API
  let credentialTest = "未测试";
  if (hasId && hasSecret) {
    try {
      const res = await fetch("https://api.github.com/rate_limit", {
        headers: {
          Authorization: "Basic " + btoa(`${env.OAUTH_CLIENT_ID}:${env.OAUTH_CLIENT_SECRET}`),
          "User-Agent": "self-blog",
        },
      });
      credentialTest = `HTTP ${res.status} — ${res.ok ? "凭证有效" : "凭证无效"}`;
      if (!res.ok) {
        const text = await res.text();
        credentialTest += ` | ${text.slice(0, 100)}`;
      }
    } catch (e) {
      credentialTest = `请求失败: ${e.message}`;
    }
  } else {
    credentialTest = "缺少 OAUTH_CLIENT_ID 或 OAUTH_CLIENT_SECRET";
  }

  return new Response(
    JSON.stringify(
      {
        env: {
          OAUTH_CLIENT_ID: hasId
            ? env.OAUTH_CLIENT_ID.slice(0, 10) + "…" + env.OAUTH_CLIENT_ID.slice(-4)
            : "未设置",
          OAUTH_CLIENT_SECRET: hasSecret ? `已设置 (${env.OAUTH_CLIENT_SECRET.length} 字符)` : "未设置",
        },
        credential_test: credentialTest,
        endpoints: {
          auth: "https://self-blog-88t.pages.dev/auth",
          callback: "https://self-blog-88t.pages.dev/callback",
        },
        next_step: "访问 /auth 手动测试 OAuth 流程",
      },
      null,
      2,
    ),
    {
      headers: { "Content-Type": "application/json" },
    },
  );
}

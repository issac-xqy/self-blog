// Cloudflare Worker — OAuth proxy for Decap CMS GitHub backend
// 部署: npx wrangler deploy
// 环境变量: OAUTH_CLIENT_ID, OAUTH_CLIENT_SECRET

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // GET /auth — 第一步：重定向到 GitHub OAuth 授权页
    if (url.pathname === "/auth") {
      const params = new URLSearchParams({
        client_id: env.OAUTH_CLIENT_ID,
        redirect_uri: url.origin + "/callback",
        scope: "repo,user",
      });
      return Response.redirect(
        `https://github.com/login/oauth/authorize?${params}`,
        302,
      );
    }

    // GET /callback — 第三步：GitHub 回调，用 code 换 token，postMessage 回给 CMS
    if (url.pathname === "/callback") {
      const code = url.searchParams.get("code");
      if (!code) {
        return new Response("Missing code", { status: 400 });
      }

      const tokenRes = await fetch(
        "https://github.com/login/oauth/access_token",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            client_id: env.OAUTH_CLIENT_ID,
            client_secret: env.OAUTH_CLIENT_SECRET,
            code,
          }),
        },
      );
      const data = await tokenRes.json();

      // 把 token 通过 postMessage 传回 CMS 窗口
      const html = `<!doctype html><html><body><script>
        (function() {
          function recieveMessage(e) {
            window.opener.postMessage(
              'authorization:github:success:${JSON.stringify(data)}',
              e.origin
            );
            window.removeEventListener("message", recieveMessage, false);
          }
          window.addEventListener("message", recieveMessage, false);
          window.opener.postMessage("authorizing:github", "*");
        })();
      </script></body></html>`;

      return new Response(html, {
        headers: { "Content-Type": "text/html" },
      });
    }

    return new Response("Not found", { status: 404 });
  },
};

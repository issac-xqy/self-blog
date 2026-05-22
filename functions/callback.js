export async function onRequest({ env, request }) {
  const url = new URL(request.url);
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

  // If GitHub returned an error, show it directly so we can see what went wrong
  if (data.error) {
    return new Response(
      `OAuth token 交换失败<br><br>
       <b>错误类型:</b> ${data.error}<br>
       <b>错误描述:</b> ${data.error_description || "无"}<br>
       <b>HTTP 状态:</b> ${tokenRes.status}<br>
       <b>Client ID:</b> ${(env.OAUTH_CLIENT_ID || "").slice(0, 10)}…<br>
       <b>Secret 长度:</b> ${(env.OAUTH_CLIENT_SECRET || "").length}`,
      {
        status: 500,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      },
    );
  }

  // Success — check what scopes were actually granted
  console.log("OAuth success — scopes:", data.scope);

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

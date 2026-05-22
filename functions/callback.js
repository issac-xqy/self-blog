export async function onRequest({ env, request }) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  if (!code) {
    return new Response("Missing code", { status: 400 });
  }

  const credentials = btoa(`${env.OAUTH_CLIENT_ID}:${env.OAUTH_CLIENT_SECRET}`);

  const tokenRes = await fetch(
    "https://github.com/login/oauth/access_token",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
        Authorization: `Basic ${credentials}`,
      },
      body: new URLSearchParams({ code }),
    },
  );
  const data = await tokenRes.json();

  // Show debug info on the page (sanitized)
  const debugInfo = data.error
    ? `<div style="color:red;font-size:18px;">Token 交换失败: ${data.error} — ${data.error_description || ""}</div>`
    : `<div style="color:green;font-size:18px;">Token 获取成功</div>
       <div>scope: ${data.scope || "未返回"}</div>
       <div>token_type: ${data.token_type || "未返回"}</div>
       <div>access_token 长度: ${(data.access_token || "").length} 字符</div>
       <div>HTTP: ${tokenRes.status}</div>`;

  const html = `<!doctype html><html><head><meta charset="utf-8"></head><body>
    <div style="font-family:monospace;max-width:600px;margin:40px auto;padding:20px;border:1px solid #ccc;border-radius:8px;">
      ${debugInfo}
      <hr>
      <div style="font-size:12px;color:#666;">Client ID: ${(env.OAUTH_CLIENT_ID || "").slice(0, 10)}…</div>
      <div style="font-size:12px;color:#666;">Secret 长度: ${(env.OAUTH_CLIENT_SECRET || "").length}</div>
    </div>
    <script>
      if (window.opener) {
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
      }
    </script>
  </body></html>`;

  return new Response(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

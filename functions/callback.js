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

  // Debug: test the token immediately
  let tokenTest = "未测试";
  if (data.access_token) {
    try {
      const userRes = await fetch("https://api.github.com/user", {
        headers: {
          Authorization: `Bearer ${data.access_token}`,
          "User-Agent": "self-blog",
        },
      });
      tokenTest = `HTTP ${userRes.status}`;
      if (userRes.ok) {
        const user = await userRes.json();
        tokenTest += ` — 用户: ${user.login} (${user.name || "无姓名"})`;
      } else {
        tokenTest += ` — ${await userRes.text().then(t => t.slice(0, 150))}`;
      }
    } catch (e) {
      tokenTest = `请求失败: ${e.message}`;
    }
  } else {
    tokenTest = "无 access_token";
  }

  const debugInfo = data.error
    ? `<div style="color:red;font-size:18px;">Token 交换失败: ${data.error} — ${data.error_description || ""}</div>`
    : `<div style="color:green;font-size:18px;">Token 获取成功</div>
       <div>scope: ${data.scope || "未返回"}</div>
       <div>token_type: ${data.token_type || "未返回"}</div>
       <div>access_token 前6位: ${(data.access_token || "").slice(0, 6)}…</div>
       <div style="margin-top:10px;padding:8px;background:#f0f0f0;border-radius:4px;">
         <b>Token 有效性测试:</b> <span style="color:${tokenTest.includes("200") ? "green" : "red"}">${tokenTest}</span>
       </div>`;

  const html = `<!doctype html><html><head><meta charset="utf-8"></head><body>
    <div style="font-family:monospace;max-width:700px;margin:40px auto;padding:20px;border:1px solid #ccc;border-radius:8px;">
      ${debugInfo}
      <hr>
      <div style="font-size:12px;color:#666;">Client ID: ${(env.OAUTH_CLIENT_ID || "").slice(0, 10)}… | Secret 长度: ${(env.OAUTH_CLIENT_SECRET || "").length}</div>
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

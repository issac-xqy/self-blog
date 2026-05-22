export async function onRequest({ env, request }) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  if (!code) {
    return new Response("Missing code", { status: 400 });
  }

  // Use HTTP Basic Auth — more reliable than body params
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

  if (data.error) {
    return new Response(
      `OAuth token 交换失败<br><br>
       <b>错误类型:</b> ${data.error}<br>
       <b>错误描述:</b> ${data.error_description || "无"}<br>
       <b>HTTP 状态:</b> ${tokenRes.status}<br>
       <b>Client ID:</b> ${(env.OAUTH_CLIENT_ID || "").slice(0, 10)}…`,
      {
        status: 500,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      },
    );
  }

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

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

  // Server-side token test
  let serverTest = "未测试";
  if (data.access_token) {
    try {
      const userRes = await fetch("https://api.github.com/user", {
        headers: {
          Authorization: `Bearer ${data.access_token.trim()}`,
          "User-Agent": "self-blog",
        },
      });
      if (userRes.ok) {
        const user = await userRes.json();
        serverTest = `HTTP ${userRes.status} — ${user.login}`;
      } else {
        serverTest = `HTTP ${userRes.status} — ${await userRes.text().then((t) => t.slice(0, 100))}`;
      }
    } catch (e) {
      serverTest = `失败: ${e.message}`;
    }
  }

  const debugInfo = data.error
    ? `<div style="color:red;font-size:18px;">Token 交换失败: ${data.error} — ${data.error_description || ""}</div>`
    : `<div style="color:green;font-size:18px;">Token 获取成功</div>
       <div>scope: ${data.scope}</div>
       <div>token: ${data.access_token.slice(0, 6)}… (${data.access_token.length} 字符)</div>
       <div style="margin:8px 0;padding:8px;background:#e8f5e9;border-radius:4px;">
         <b>服务器端 /user 测试:</b> <span style="color:green">${serverTest}</span>
       </div>
       <div id="browser-test" style="margin:8px 0;padding:8px;background:#f5f5f5;border-radius:4px;">
         <b>浏览器端 /user 测试:</b> <span id="browser-result" style="color:#999">等待测试…</span>
       </div>`;

  const tokenJson = JSON.stringify(data);

  const html = `<!doctype html><html><head><meta charset="utf-8"></head><body>
    <div style="font-family:monospace;max-width:700px;margin:40px auto;padding:20px;border:1px solid #ccc;border-radius:8px;">
      ${debugInfo}
      <hr>
      <div style="font-size:12px;color:#666;">
        Client ID: ${(env.OAUTH_CLIENT_ID || "").slice(0, 10)}… | Secret: ${(env.OAUTH_CLIENT_SECRET || "").length} 字符
      </div>
    </div>
    <script>
      var tokenData = ${tokenJson};
      // Some CMS versions need "token" instead of "access_token"
      if (tokenData.access_token && !tokenData.token) {
        tokenData.token = tokenData.access_token;
      }

      // Browser-side test: call /user directly from JavaScript
      if (tokenData.access_token) {
        var resultEl = document.getElementById("browser-result");
        fetch("https://api.github.com/user", {
          headers: {
            Authorization: "Bearer " + tokenData.access_token.trim(),
            "User-Agent": "self-blog"
          }
        }).then(function(res) {
          if (res.ok) {
            return res.json().then(function(u) {
              resultEl.style.color = "green";
              resultEl.textContent = "HTTP " + res.status + " — " + u.login;
            });
          } else {
            resultEl.style.color = "red";
            resultEl.textContent = "HTTP " + res.status + " — " + res.statusText;
          }
        }).catch(function(e) {
          resultEl.style.color = "red";
          resultEl.textContent = "请求失败: " + e.message;
        });
      }

      // Pass token back to CMS opener
      if (window.opener) {
        (function() {
          function recieveMessage(e) {
            window.opener.postMessage(
              'authorization:github:success:' + JSON.stringify(tokenData),
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

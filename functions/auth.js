export async function onRequest({ env, request }) {
  const url = new URL(request.url);
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

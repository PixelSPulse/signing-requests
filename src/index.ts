function expectedAppOriginFromApiHost(host) {
  // host может быть 'api.catino.vip' или 'api.catino.vip:443'
  const h = (host || "").toLowerCase().split(":")[0];

  // Требуем, чтобы это был именно api.{zone}
  if (!h.startsWith("api.")) return null;

  const zone = h.slice("api.".length); // 'catino.vip'
  if (!zone) return null;

  return `https://${zone}`;
}

function isAllowedByDynamicOrigin(request) {
  const host = request.headers.get("Host") || "";
  const expectedOrigin = expectedAppOriginFromApiHost(host);
  if (!expectedOrigin) return false;

  const origin = request.headers.get("Origin") || "";
  const referer = request.headers.get("Referer") || "";

  // Для fetch/XHR браузер обычно отправляет Origin (особенно при CORS)
  if (origin === expectedOrigin) return true;

  // Для некоторых навигаций/редких кейсов может быть Referer
  if (referer.startsWith(expectedOrigin + "/")) return true;

  return false;
}

export default {
  async fetch(request, env) {
    const headers = new Headers(request.headers);

    // Добавляем токен только если запрос "своего" app.{zone} к api.{zone}
    if (isAllowedByDynamicOrigin(request)) {
      headers.set("X-Edge-Token", env.EDGE_TOKEN);
    }

    const newRequest = new Request(request.url, {
      method: request.method,
      headers,
      body:
        request.method === "GET" || request.method === "HEAD"
          ? undefined
          : request.body,
      redirect: "manual",
    });

    return fetch(newRequest);
  },
};

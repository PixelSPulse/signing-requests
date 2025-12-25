function parseHostNoPort(host) {
  return (host || "").toLowerCase().split(":")[0];
}

function expectedOriginsFromApiHost(host) {
  const h = parseHostNoPort(host);

  if (!h.startsWith("api.")) return null;

  const zone = h.slice("api.".length); // например "catino.vip"
  if (!zone) return null;

  return [`https://${zone}`, `https://app.${zone}`];
}

function isAllowedByDynamicOrigin(request) {
  const host = request.headers.get("Host") || "";
  const allowedOrigins = expectedOriginsFromApiHost(host);
  if (!allowedOrigins) return false;

  const origin = request.headers.get("Origin") || "";
  const referer = request.headers.get("Referer") || "";

  if (origin && allowedOrigins.includes(origin)) return true;

  if (referer) {
    for (const o of allowedOrigins) {
      if (referer.startsWith(o + "/")) return true;
      if (referer === o) return true;
    }
  }

  return false;
}

export default {
  async fetch(request, env) {
    const headers = new Headers(request.headers);

    // Добавляем токен только если запрос пришёл с root домена или app.{zone}
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

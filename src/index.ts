function extractZoneFromHost(host) {
  if (!host) return null;

  let zone = host.toLowerCase().split(":")[0];

  const STRIP_PREFIXES = [
    "app.",
    "www.",
    // "web.",
    // "frontend.",
  ];

  for (const prefix of STRIP_PREFIXES) {
    if (zone.startsWith(prefix)) {
      zone = zone.slice(prefix.length);
      break;
    }
  }

  return zone || null;
}
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Обрабатываем только /api/*
    if (!url.pathname.startsWith("/api/")) {
      return new Response("Not found", { status: 404 });
    }

    // Определяем zone из текущего хоста
    // mellcs.games        -> api.mellcs.games
    // app.catino.vip      -> api.catino.vip
    // www.example.com     -> api.example.com
    const host = request.headers.get("Host") || "";
    const zone = extractZoneFromHost(host);

    const targetUrl = new URL(`https://api.${zone}`);
    targetUrl.pathname = url.pathname.replace(/^\/api/, "");
    targetUrl.search = url.search;

    // Копируем заголовки и добавляем серверный токен
    const newHeaders = new Headers(request.headers);
    newHeaders.set("X-Edge-Token", env.EDGE_TOKEN);

    const proxiedRequest = new Request(targetUrl.toString(), {
      method: request.method,
      headers: newHeaders,
      body:
        request.method === "GET" || request.method === "HEAD"
          ? undefined
          : request.body,
      redirect: "manual",
    });

    return fetch(proxiedRequest);
  },
};

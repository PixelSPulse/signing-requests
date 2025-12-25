export default {
  async fetch(request, env) {
    const headers = new Headers(request.headers);
    headers.set("X-Edge-Token", env.EDGE_TOKEN);

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

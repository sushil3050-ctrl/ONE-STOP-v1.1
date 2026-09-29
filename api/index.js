import server from "../dist/server/server.js";

export default async function handler(request, response) {
  const protocol = request.headers["x-forwarded-proto"] || "https";
  const host = request.headers.host || "localhost";
  const url = new URL(request.url || "/", `${protocol}://${host}`);
  const method = request.method || "GET";
  const headers = new Headers();

  for (const [name, value] of Object.entries(request.headers)) {
    if (Array.isArray(value)) {
      for (const item of value) headers.append(name, item);
    } else if (value !== undefined) {
      headers.set(name, value);
    }
  }

  let body;
  if (method !== "GET" && method !== "HEAD") {
    const chunks = [];
    for await (const chunk of request) chunks.push(chunk);
    body = Buffer.concat(chunks);
  }

  const appResponse = await server.fetch(
    new Request(url, { method, headers, body }),
    {},
    {},
  );

  response.statusCode = appResponse.status;
  for (const [name, value] of appResponse.headers) response.setHeader(name, value);
  response.end(Buffer.from(await appResponse.arrayBuffer()));
}

import { QuoteRequest } from "./schema";
import { fetchAvatar } from "./avatar";
import { renderQuote } from "./render";

const PORT = Number(process.env.PORT ?? 3000);

const server = Bun.serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url);

    if (url.pathname === "/health") {
      return new Response("ok pyon\n", { headers: { "content-type": "text/plain" } });
    }

    if (url.pathname === "/quote" && req.method === "POST") {
      let body: unknown;
      try {
        body = await req.json();
      } catch {
        return jsonError(400, "invalid json");
      }

      const parsed = QuoteRequest.safeParse(body);
      if (!parsed.success) {
        return Response.json(
          { error: "validation failed", issues: parsed.error.issues },
          { status: 400 },
        );
      }

      try {
        const avatar = await fetchAvatar(parsed.data.avatarUrl);
        const { png, style } = await renderQuote(parsed.data, avatar);
        return new Response(png, {
          headers: {
            "content-type": "image/png",
            // debugの時にどっちのlayoutで描かれたか分かるように pyon
            "x-pyon-style": style,
            "cache-control": "no-store",
          },
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : "unknown error";
        console.error("[pyon] render failed orz:", msg);
        return jsonError(500, msg);
      }
    }

    return jsonError(404, "not found");
  },
});

console.log(`pyon up at http://localhost:${server.port} pyon〜`);

function jsonError(status: number, message: string) {
  return Response.json({ error: message }, { status });
}

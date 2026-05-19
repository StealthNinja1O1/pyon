import type { Server } from "bun";
import { QuoteRequest } from "./schema";
import { fetchAvatar } from "./avatar";
import { renderQuote } from "./render";
import { authOk } from "./auth";
import { rateLimitOk } from "./ratelimit";

const PORT = Number(process.env.PORT ?? 3000);

// 16KB. text 500文字 + name 80x2 + url + hex + jsonの飾り、余裕で収まる pyon
const MAX_BODY = 16 * 1024;

// caddy / nginx 越しなら x-forwarded-for を信用したい. 直で公開してるならspoof放題なのでoff
const TRUST_PROXY = process.env.TRUST_PROXY === "1" || process.env.TRUST_PROXY === "true";

const server = Bun.serve({
  port: PORT,
  async fetch(req, server) {
    const url = new URL(req.url);

    if (url.pathname === "/health") {
      return new Response("ok pyon\n", { headers: { "content-type": "text/plain" } });
    }

    if (url.pathname === "/quote" && req.method === "POST") {
      const ip = clientIp(req, server);

      // 順番大事 pyon: cheap check から並べる
      // rate limit → auth → size → parse → validate → render

      if (!rateLimitOk(ip)) {
        return jsonError(429, "slow down pyon");
      }

      if (!authOk(req)) {
        return jsonError(401, "unauthorized");
      }

      const lenHeader = req.headers.get("content-length");
      const len = lenHeader ? Number(lenHeader) : 0;
      if (len > MAX_BODY) {
        return jsonError(413, "payload too large");
      }

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

// proxy越しなら x-forwarded-for の先頭がclient. 直公開だとspoofできるのでTRUST_PROXY=falseで無視
function clientIp(req: Request, server: Server<unknown>): string {
  if (TRUST_PROXY) {
    const xff = req.headers.get("x-forwarded-for");
    if (xff) {
      const first = xff.split(",")[0]?.trim();
      if (first) return first;
    }
    const real = req.headers.get("x-real-ip");
    if (real) return real;
  }
  return server.requestIP(req)?.address ?? "unknown";
}

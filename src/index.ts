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
    const requestId = crypto.randomUUID();
    const url = new URL(req.url);

    if (url.pathname === "/health") {
      return new Response("ok pyon\n", {
        headers: { "content-type": "text/plain", "x-pyon-request-id": requestId },
      });
    }

    if (url.pathname === "/quote" && req.method === "POST") {
      const ip = clientIp(req, server);

      // cheap check 順 pyon. rate limit が auth より先なのは key bruteforce 抑止
      if (!rateLimitOk(ip)) return jsonError(429, "slow down pyon", requestId);
      if (!authOk(req)) return jsonError(401, "unauthorized", requestId);

      const lenHeader = req.headers.get("content-length");
      const len = lenHeader ? Number(lenHeader) : 0;
      if (len > MAX_BODY) return jsonError(413, "payload too large", requestId);

      let body: unknown;
      try {
        body = await req.json();
      } catch {
        return jsonError(400, "invalid json", requestId);
      }

      const parsed = QuoteRequest.safeParse(body);
      if (!parsed.success) {
        // zod の issues は schema形状を漏らすので server log only pyon
        console.warn(`[pyon] ${requestId} validation failed`, parsed.error.issues);
        return jsonError(400, "validation failed", requestId);
      }

      try {
        const avatar = await fetchAvatar(parsed.data.avatarUrl);
        const { png, style } = await renderQuote(parsed.data, avatar);
        return new Response(png, {
          headers: {
            "content-type": "image/png",
            // debug用 pyon: どっちのlayoutで描かれたか
            "x-pyon-style": style,
            "x-pyon-request-id": requestId,
            "cache-control": "no-store",
          },
        });
      } catch (err) {
        // err.message は SSRF target や internal port状態を oracle 化するので外に出さない pyon
        console.error(`[pyon] ${requestId} render failed orz`, err);
        return jsonError(500, "render failed", requestId);
      }
    }

    return jsonError(404, "not found", requestId);
  },
});

console.log(`pyon up at http://localhost:${server.port} pyon〜`);

function jsonError(status: number, message: string, requestId: string) {
  return Response.json(
    { error: message, requestId },
    { status, headers: { "x-pyon-request-id": requestId } },
  );
}

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

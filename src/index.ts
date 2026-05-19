import type { Server } from "bun";
import { QuoteRequest } from "./schema";
import { fetchAvatar } from "./avatar";
import { renderQuote } from "./render";
import { authOk } from "./auth";
import { rateLimitOk } from "./ratelimit";
import { tryAcquireSlot, releaseSlot } from "./semaphore";

const PORT = Number(process.env.PORT ?? 3000);

// 16KB. text 500文字 + name 80x2 + url + hex + jsonの飾り、余裕で収まる pyon
const MAX_BODY = 16 * 1024;

// caddy / nginx 越しなら x-forwarded-for を信用したい. 直で公開してるならspoof放題なのでoff
const TRUST_PROXY = process.env.TRUST_PROXY === "1" || process.env.TRUST_PROXY === "true";

// avatar fetch 5s + render 数百ms 想定. これ越えるのは何かおかしい pyon
const REQ_TIMEOUT_MS = Number(process.env.PYON_REQ_TIMEOUT_MS ?? 15_000);

class RequestTimeoutError extends Error {
  constructor() {
    super("request timeout");
    this.name = "RequestTimeoutError";
  }
}

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
        // zod issuesは schema 形状を漏らすので server log only pyon
        console.warn(`[pyon] ${requestId} validation failed`, parsed.error.issues);
        return jsonError(400, "validation failed", requestId);
      }

      // 重い処理は slot 取ってから. validation 失敗で slot 食わないように順番ここ
      if (!tryAcquireSlot()) return jsonError(503, "busy pyon, try again", requestId);

      const work = renderJob(parsed.data);
      // timeoutで先抜けした場合の late rejection を unhandled にしないため pyon
      work.catch(() => {});

      try {
        const { png, style } = await withTimeout(work, REQ_TIMEOUT_MS);
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
        const timedOut = err instanceof RequestTimeoutError;
        // err.message は SSRF target や internal port状態を oracle 化するので外に出さない pyon
        console.error(`[pyon] ${requestId} ${timedOut ? "timed out" : "render failed orz"}`, err);
        return jsonError(
          timedOut ? 504 : 500,
          timedOut ? "render timeout" : "render failed",
          requestId,
        );
      }
    }

    return jsonError(404, "not found", requestId);
  },
});

console.log(`pyon up at http://localhost:${server.port} pyon〜`);

async function renderJob(data: QuoteRequest) {
  try {
    const avatar = await fetchAvatar(data.avatarUrl);
    return await renderQuote(data, avatar);
  } finally {
    releaseSlot();
  }
}

async function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new RequestTimeoutError()), ms);
  });
  try {
    return await Promise.race([p, timeout]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

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

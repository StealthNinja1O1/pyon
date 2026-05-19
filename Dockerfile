# pyon container pyon. multi-stage so the runtime image stays slim.
# debian-slim over alpine because resvg-js native bindings hate musl on
# random days. not worth the debugging pyon!!!

FROM oven/bun:1-slim AS deps
WORKDIR /app
COPY package.json bun.lock* bun.lockb* ./
RUN bun install --frozen-lockfile --production

FROM oven/bun:1-slim AS runtime
WORKDIR /app

# non-root pyon. cheap win.
RUN groupadd -r pyon && useradd -r -g pyon -d /app pyon

COPY --from=deps /app/node_modules ./node_modules
COPY --chown=pyon:pyon src ./src
COPY --chown=pyon:pyon package.json tsconfig.json ./

USER pyon

ENV NODE_ENV=production \
    PORT=3000

EXPOSE 3000

# if /health stops 200ing, the orchestrator can yeet and restart us pyon
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD bun -e "fetch('http://127.0.0.1:'+process.env.PORT+'/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["bun", "src/index.ts"]

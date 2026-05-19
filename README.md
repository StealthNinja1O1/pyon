# pyon

quote cards as PNGs pyon. discord bot 用. text 投げる -> pretty image 返る.

## run it

```
bun install
bun dev   # localhost:3000 で起動
```

## use it pyon

```http
POST /quote
content-type: application/json
```

```json
{
  "text": "the quote pyon",
  "displayName": "Miyo",
  "username": "miyo",
  "avatarUrl": "https://cdn.discordapp.com/...",
  "accentColor": "#ff5fa2",
  "style": "cinematic"
}
```

returns 1200x630 PNG. `x-pyon-style` ヘッダにどっちのlayoutで描いたか入ってる pyon.

`PYON_KEY` 設定してる時は `x-pyon-key: <key>` header 必須 pyon. 無いと 401.

全 response に `x-pyon-request-id` ヘッダついてる. error の json body にも `requestId` 入る、support ticket時はこれ貼って pyon.

| field | required | note |
|---|---|---|
| `text` | yes | max 500 文字、それ以上はlayoutが先に詰む |
| `displayName` | yes | max 80 |
| `username` | yes | max 80 |
| `avatarUrl` | yes | https + allowlistedなhostのみ. default は discord CDN. `PYON_AVATAR_ALLOWED_HOSTS` で上書き pyon |
| `accentColor` | no | `#rrggbb`、省略時 brand pink `#ff5fa2` |
| `style` | no | `cinematic` \| `editorial`、省略時 server が random |

## layouts

- **cinematic**: avatar 左から fade、でっかい " マーク、ドラマチック
- **editorial**: pink マシマシ、structured、polished

両方とも quote の attribution は `— DisplayName / @handle` のcitation-style pyon.

## known stuff (読んでおいて pyon)

- variable font だと satori の parser が死ぬ事件あり orz → fontsource の静的 woff per weight に逃げた
- cache layer まだない、同じquote 2回投げたら2回render する (later pyon〜)

## env pyon

| var | default | note |
|---|---|---|
| `PORT` | `3000` | listen port |
| `PYON_KEY` | (empty) | 空だとauth無効でwarning出る. publicに置くなら設定必須 pyon |
| `TRUST_PROXY` | (off) | `1` で `x-forwarded-for` を信用. caddy/nginx 越しならon |
| `PYON_AVATAR_ALLOWED_HOSTS` | `cdn.discordapp.com,media.discordapp.net` | comma-separated. avatarURLで許す host. SSRF対策の核 pyon |

## abuse limits pyon

- per-IP rate limit: 10 req/sec burst, refill 10/sec
- body size cap: 16KB
- `x-pyon-key` 不一致は 401, body超過は 413, rate over は 429

## scripts

- `bun dev` - hot reload で起動
- `bun start` - 普通に起動
- `bun run typecheck` - tsc

pyon!

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

| field | required | note |
|---|---|---|
| `text` | yes | max 500 文字、それ以上はlayoutが先に詰む |
| `displayName` | yes | max 80 |
| `username` | yes | max 80 |
| `avatarUrl` | yes | https のみ (SSRF対策 pyon) |
| `accentColor` | no | `#rrggbb`、省略時 brand pink `#ff5fa2` |
| `style` | no | `cinematic` \| `editorial`、省略時 server が random |

## layouts

- **cinematic**: avatar 左から fade、でっかい " マーク、ドラマチック
- **editorial**: pink マシマシ、structured、polished

両方とも quote の attribution は `— DisplayName / @handle` のcitation-style pyon.

## known stuff (読んでおいて pyon)

- variable font だと satori の parser が死ぬ事件あり orz → fontsource の静的 woff per weight に逃げた
- cache layer まだない、同じquote 2回投げたら2回render する (later pyon〜)

## scripts

- `bun dev` - hot reload で起動
- `bun start` - 普通に起動
- `bun run typecheck` - tsc

pyon!

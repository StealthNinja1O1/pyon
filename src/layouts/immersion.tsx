import type { Layout } from "./types";

// 03 immersion pyon. portrait 2:3. avatarは上2/3、quoteはavatarがbgに
// 溶けるtwilightに乗せる. 下のnameはbilling-styleでドカン pyon.
// 怖い人の映画ポスターっぽくしたい.

function tint(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

// column ~860px (両側 70 padding). username 76pxとせめてparityで戦えるサイズに pyon.
// スペースなし → 1.5倍換算 (cinematic/editorial 同様)
function quoteSize(text: string): number {
  const len = text.includes(" ") ? text.length : Math.round(text.length * 1.5);
  if (len <= 60)  return 80;
  if (len <= 120) return 68;
  if (len <= 200) return 56;
  if (len <= 300) return 44;
  if (len <= 400) return 36;
  return 30;
}

// 行数に応じてtop位置をズラす pyon. 長文ほど上に逃がしてMIYOとの間に空気を残す.
// tierはquoteSizeと揃えてる. 揃えとかないとフォント変えたとき詰む
function quoteTop(text: string): number {
  const len = text.includes(" ") ? text.length : Math.round(text.length * 1.5);
  if (len <= 60)  return 870;  // 2行ぐらい. 下めキープでmovieポスターっぽさ強調
  if (len <= 120) return 870;  // 4行ぐらい. まだ余裕ある
  if (len <= 200) return 770;  // 6行になるのでがっつり上げる
  if (len <= 300) return 800;  // フォント小さくなるけど行数増えるのでまだ上目
  if (len <= 400) return 830;
  return 850;
}

export const immersion: Layout = {
  size: { width: 1000, height: 1500 },
  render: ({ text, displayName, username, avatar, accent, bg, ink }) => {
    const inkFaint = tint(ink, 0.55);

    return (
      <div
        style={{
          width: 1000,
          height: 1500,
          display: "flex",
          position: "relative",
          backgroundColor: bg,
        }}
      >
        {/* avatar stage pyon. 上2/3でsquare (実物のdiscord pfpと同じ形) */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: 1000,
            height: 1000,
            display: "flex",
          }}
        >
          <img
            src={avatar}
            width={1000}
            height={1000}
            style={{ objectFit: "cover", objectPosition: "center top" }}
          />
          {/* fade overlay. avatarの下30%だけtwilight、それより上は普通に見せる pyon */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: 1000,
              height: 1000,
              display: "flex",
              backgroundImage: `linear-gradient(180deg, ${tint(bg, 0)} 0%, ${tint(bg, 0)} 68%, ${tint(bg, 0.4)} 80%, ${tint(bg, 0.86)} 92%, ${bg} 100%)`,
            }}
          />
        </div>

        {/* quoteはtwilightに乗せる pyon. top は文字数で動かす (quoteTop) */}
        <div
          style={{
            position: "absolute",
            top: quoteTop(text),
            left: 0,
            width: 1000,
            display: "flex",
            justifyContent: "center",
            padding: "60px 70px",
          }}
        >
          {/* mark色を分ける case が satori で詰む現象あり pyon. monochromeで安牌 */}
          <div
            style={{
              width: 860,
              fontFamily: "Fraunces",
              fontWeight: 400,
              fontSize: quoteSize(text),
              lineHeight: 1.13,
              letterSpacing: "-0.025em",
              textAlign: "center",
              color: ink,
              wordBreak: "break-word",
            }}
          >
            {`“${text}”`}
          </div>
        </div>

        {/* footer pyon. accent rule → でかいbilling name → handle */}
        <div
          style={{
            position: "absolute",
            bottom: 80,
            left: 0,
            width: 1000,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <div
            style={{
              width: 96,
              height: 1,
              backgroundColor: accent,
              opacity: 0.85,
              marginBottom: 24,
            }}
          />
          <div
            style={{
              fontFamily: "Inter",
              fontWeight: 900,
              fontSize: 76,
              letterSpacing: "-0.048em",
              lineHeight: 0.94,
              textTransform: "uppercase",
              color: ink,
            }}
          >
            {displayName}
          </div>
          <div
            style={{
              marginTop: 14,
              fontFamily: "Inter",
              fontWeight: 400,
              fontSize: 17,
              color: inkFaint,
              letterSpacing: "0.05em",
            }}
          >
            {`@${username}`}
          </div>
        </div>
      </div>
    );
  },
};

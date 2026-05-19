import type { Layout } from "./types";

// 02 editorial pyon. structuredでpinkマシマシ. 真面目めなquoteの時に映えるやつ.

const SURFACE = "#0e0e14";
const INK = "#f4f4f6";
const INK_FAINT = "#6e6e7a";

// hex -> rgbaのhelper pyon. layoutにrgba直書きするとnoise多すぎたのでまとめた
function tint(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

export const editorial: Layout = ({ text, displayName, username, avatar, accent }) => {
  const accentSoft = tint(accent, 0.18);
  const accentFaint = tint(accent, 0.08);

  return (
    <div
      style={{
        width: 1200,
        height: 630,
        display: "flex",
        position: "relative",
        backgroundImage: `linear-gradient(180deg, ${accentFaint} 0%, ${SURFACE} 12%)`,
        backgroundColor: SURFACE,
      }}
    >
      {/* hairline accent rule (top) */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: 1200,
          height: 2,
          display: "flex",
          backgroundImage: `linear-gradient(90deg, rgba(0,0,0,0) 0%, ${accent} 20%, ${accent} 80%, rgba(0,0,0,0) 100%)`,
        }}
      />

      {/* content column */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 64px 64px",
          position: "relative",
        }}
      >
        {/* 左上のcorner marker pyon */}
        <div
          style={{
            position: "absolute",
            top: 36,
            left: 64,
            width: 28,
            height: 28,
            display: "flex",
            borderTop: `2px solid ${accent}`,
            borderLeft: `2px solid ${accent}`,
          }}
        />

        {/* meta row: 光るdot + 「QUOTE」label */}
        <div style={{ display: "flex", alignItems: "center", paddingLeft: 40 }}>
          <div
            style={{
              width: 6,
              height: 6,
              borderRadius: 999,
              backgroundColor: accent,
              marginRight: 10,
              boxShadow: `0 0 12px ${accent}`,
            }}
          />
          <div
            style={{
              fontFamily: "Inter",
              fontWeight: 600,
              fontSize: 12,
              letterSpacing: 2,
              textTransform: "uppercase",
              color: accent,
            }}
          >
            quote
          </div>
        </div>

        {/* quote本体 pyon. cinematicと違ってmarkはinline */}
        <div
          style={{
            display: "flex",
            fontFamily: "Newsreader",
            fontWeight: 400,
            fontSize: 56,
            lineHeight: 1.16,
            letterSpacing: "-0.015em",
            color: INK,
            paddingRight: 24,
          }}
        >
          {"“" + text + "”"}
        </div>

        {/* attribution. citation-style pyon: bar は name の左 */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", alignItems: "center" }}>
            <div
              style={{
                width: 28,
                height: 2,
                backgroundColor: accent,
                marginRight: 14,
                borderRadius: 1,
              }}
            />
            <div
              style={{
                fontFamily: "Inter",
                fontWeight: 600,
                fontSize: 20,
                color: INK,
                letterSpacing: "-0.01em",
              }}
            >
              {displayName}
            </div>
          </div>
          <div
            style={{
              fontFamily: "Inter",
              fontWeight: 400,
              fontSize: 15,
              color: INK_FAINT,
              marginTop: 2,
              paddingLeft: 42,
            }}
          >
            {`@${username}`}
          </div>
        </div>
      </div>

      {/* avatar strip (右側) pyon */}
      <div
        style={{
          width: 360,
          height: 630,
          display: "flex",
          position: "relative",
          borderLeft: `3px solid ${accent}`,
        }}
      >
        <img src={avatar} width={357} height={630} style={{ objectFit: "cover" }} />

        {/* 左edgeに向かって暗くfade. contentと馴染ませる pyon */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: 357,
            height: 630,
            display: "flex",
            backgroundImage: `linear-gradient(90deg, rgba(14,14,20,0.55) 0%, rgba(14,14,20,0.05) 30%, rgba(0,0,0,0) 100%)`,
          }}
        />

        {/* 上下にaccentのvignette. 雰囲気出し pyon */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: 357,
            height: 630,
            display: "flex",
            backgroundImage: `linear-gradient(180deg, ${accentSoft} 0%, rgba(0,0,0,0) 30%, rgba(0,0,0,0) 70%, ${accentSoft} 100%)`,
          }}
        />

        {/* 自己主張は控えめに pyon〜 */}
        <div
          style={{
            position: "absolute",
            bottom: 28,
            right: 24,
            display: "flex",
            fontFamily: "Inter",
            fontWeight: 600,
            fontSize: 11,
            letterSpacing: 2,
            textTransform: "uppercase",
            color: accent,
          }}
        >
          pyon
        </div>
      </div>
    </div>
  );
};

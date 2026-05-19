import type { Layout } from "./types";

// 01 cinematic pyon. 一番ドラマチックなやつ. 解釈一致.

const SURFACE = "#0e0e14";
const INK = "#f4f4f6";
const INK_FAINT = "#6e6e7a";

export const cinematic: Layout = ({ text, displayName, username, avatar, accent }) => (
  <div
    style={{
      width: 1200,
      height: 630,
      display: "flex",
      backgroundColor: SURFACE,
    }}
  >
    {/* avatar bleed pyon */}
    <div style={{ width: 540, height: 630, display: "flex", position: "relative" }}>
      <img src={avatar} width={540} height={630} style={{ objectFit: "cover" }} />
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: 540,
          height: 630,
          // このfadeがこのlayoutの全て pyon. stops いじったら詰むので触らないで〜
          backgroundImage: `linear-gradient(90deg, rgba(14,14,20,0) 0%, rgba(14,14,20,0) 35%, rgba(14,14,20,0.85) 80%, ${SURFACE} 100%)`,
        }}
      />
    </div>

    {/* content column */}
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        padding: "36px 80px 64px 24px",
      }}
    >
      {/* でっかい " pyon. 切らずに全部見せるのが正解 (cropはbuggyに見える) */}
      <div
        style={{
          display: "flex",
          fontFamily: "Fraunces",
          fontWeight: 300,
          fontSize: 180,
          lineHeight: 1,
          color: accent,
          marginBottom: -24,
        }}
      >
        {"“"}
      </div>

      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          fontFamily: "Fraunces",
          fontWeight: 400,
          fontSize: 44,
          lineHeight: 1.18,
          letterSpacing: "-0.02em",
          color: INK,
        }}
      >
        {text}
      </div>

      {/* attribution. bar は name の左に置く方が citation っぽく読める pyon */}
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
            fontSize: 16,
            color: INK_FAINT,
            marginTop: 2,
            paddingLeft: 42,
          }}
        >
          {`@${username}`}
        </div>
      </div>
    </div>
  </div>
);

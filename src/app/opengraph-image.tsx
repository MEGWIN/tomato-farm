import { ImageResponse } from "next/og";

export const alt = "MEGWIN公式サイト｜水耕栽培 × ライブ配信 × ギミック";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background:
            "linear-gradient(135deg, #EC4899 0%, #F59E0B 50%, #84CC16 100%)",
          color: "#fff",
          fontFamily: "sans-serif",
          padding: "60px",
        }}
      >
        <div style={{ fontSize: 180, lineHeight: 1, marginBottom: 20 }}>🍅</div>
        <div
          style={{
            fontSize: 96,
            fontWeight: 900,
            letterSpacing: "-0.02em",
            textShadow: "0 4px 24px rgba(0,0,0,0.25)",
            marginBottom: 24,
          }}
        >
          MEGWIN
        </div>
        <div
          style={{
            fontSize: 44,
            fontWeight: 700,
            textShadow: "0 2px 12px rgba(0,0,0,0.25)",
            display: "flex",
            gap: 24,
          }}
        >
          <span>水耕栽培</span>
          <span style={{ opacity: 0.7 }}>×</span>
          <span>ライブ配信</span>
          <span style={{ opacity: 0.7 }}>×</span>
          <span>ギミック</span>
        </div>
        <div
          style={{
            marginTop: 40,
            fontSize: 28,
            fontWeight: 500,
            opacity: 0.95,
            textShadow: "0 2px 8px rgba(0,0,0,0.25)",
          }}
        >
          自動化 × 配信 の実験場
        </div>
      </div>
    ),
    { ...size }
  );
}

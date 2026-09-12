import { createCanvas, loadImage } from "canvas";
import fs from "fs";
import path from "path";

function formatUsd(n) {
  const num = Number(n) || 0;
  if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
  if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
  if (num >= 1e3) return `$${(num / 1e3).toFixed(2)}K`;
  return `$${num.toFixed(2)}`;
}

export async function generateTokenIntroCard({
  name,
  symbol,
  bannerUrl,
  marketCap,
  volume24h,
  liquidityUsd,
  priceChangePercent,
}) {
  const width = 800,
    height = 500;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");
  const bannerHeight = 340;

  ctx.fillStyle = "#111318";
  ctx.fillRect(0, 0, width, bannerHeight);
  if (bannerUrl) {
    try {
      const banner = await loadImage(bannerUrl);
      const scale = Math.max(
        width / banner.width,
        bannerHeight / banner.height,
      );
      const sw = width / scale,
        sh = bannerHeight / scale;
      const sx = (banner.width - sw) / 2,
        sy = (banner.height - sh) / 2;
      ctx.drawImage(banner, sx, sy, sw, sh, 0, 0, width, bannerHeight);
    } catch (err) {
      console.error("banner load failed, using fallback bg", err.message);
    }
  }
  // symbol batch top-left
  ctx.fillStyle = "rgba(0,0,0,0.55)";
  ctx.fillRect(0, 0, 220, 50);
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 24px sans-serif";
  ctx.fillText(symbol, 16, 33);

  // % change badge, top-right
  const up = priceChangePercent >= 0;
  ctx.font = "bold 22px sans-serif";
  const badgeText = `${up ? "+" : ""}${priceChangePercent.toFixed(2)}%`;
  const badgeWidth = ctx.measureText(badgeText).width + 24;
  ctx.fillStyle = up ? "#22c55e" : "#ef4444";
  ctx.fillRect(width - badgeWidth - 16, 12, badgeWidth, 38);
  ctx.fillStyle = "#0d0d12";
  ctx.fillText(badgeText, width - badgeWidth - 4, 38);

  // bottom stat bar
  ctx.fillStyle = "#0d0d12";
  ctx.fillRect(0, bannerHeight, width, height - bannerHeight);
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 26px sans-serif";
  ctx.fillText(name, 24, bannerHeight + 45);

  const stats = [
    ["MCAP", formatUsd(marketCap)],
    ["24H", formatUsd(volume24h)],
    ["LIQUIDITY", formatUsd(liquidityUsd)],
  ];

  const colWidth = width / stats.length;
  stats.forEach(([label, value], i) => {
    const x = i * colWidth + 24;
    ctx.fillStyle = "#9ca3af";
    ctx.fillText(label, x, bannerHeight + 95);
    ctx.font = "bold 22px sans-serif";
    ctx.fillStyle = "#ffffff";
    ctx.fillText(value, x, bannerHeight + 125);
  });

  return canvas.toBuffer("image/png");
}

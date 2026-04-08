import { NextResponse } from "next/server";
import { MARKET_ASSETS } from "@/lib/constants";

// Simulate market price fluctuations
// In production, this could be more sophisticated

export async function GET() {
  // Add some random variation to prices (±10%)
  const assetsWithPrices = MARKET_ASSETS.map((asset) => {
    const variation = 0.9 + Math.random() * 0.2; // 0.9 to 1.1
    return {
      ...asset,
      currentPrice: Math.floor(asset.basePrice * variation),
    };
  });

  return NextResponse.json({
    assets: assetsWithPrices,
    lastUpdated: new Date().toISOString(),
  });
}

"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useGameStore } from "@/store/gameStore";
import { GAME_CONFIG } from "@/lib/constants";
import type { StockItem } from "@/types/game";

type PriceDirection = "up" | "down" | "flat";

interface StockSnapshot {
  stock: StockItem;
  currentPrice: number;
  previousPrice: number;
  change: number;
  changePercent: number;
  direction: PriceDirection;
  todayNews: string;
  projectedDirection: PriceDirection;
}

function getLoopIndex(day: number, loopLength: number): number {
  if (loopLength <= 0) return 0;
  return Math.max(0, day - 1) % loopLength;
}

function getPrice(stock: StockItem, day: number): number {
  const loop = Array.isArray(stock.priceLoop) ? stock.priceLoop : [];
  if (!loop || loop.length === 0) {
    return stock.points[stock.points.length - 1]?.price || 0;
  }
  return loop[getLoopIndex(day, loop.length)];
}

function getDirection(current: number, previous: number): PriceDirection {
  if (current > previous) return "up";
  if (current < previous) return "down";
  return "flat";
}

function getDirectionLabel(direction: PriceDirection): string {
  if (direction === "up") return "Likely Up";
  if (direction === "down") return "Likely Down";
  return "Likely Stable";
}

function getDirectionTone(direction: PriceDirection): string {
  if (direction === "up") return "text-emerald-700 bg-emerald-100 border-emerald-200";
  if (direction === "down") return "text-rose-700 bg-rose-100 border-rose-200";
  return "text-slate-700 bg-slate-100 border-slate-200";
}

function getDirectionGlyph(direction: PriceDirection): string {
  if (direction === "up") return "▲";
  if (direction === "down") return "▼";
  return "■";
}

function buildChartData(stock: StockItem, currentDay: number) {
  const loop = Array.isArray(stock.priceLoop) ? stock.priceLoop : [];
  const loopLength = Math.max(1, loop.length);
  const startDay = Math.max(1, currentDay - 6);
  const chart = [] as Array<{ day: string; price: number }>;

  for (let day = startDay; day <= currentDay; day += 1) {
    const price = loop.length > 0 ? loop[getLoopIndex(day, loopLength)] : getPrice(stock, day);
    chart.push({ day: `D${day}`, price });
  }

  return chart;
}

export function StockInvestment() {
  const {
    currentDay,
    currentPhase,
    player,
    stockItems,
    stockHoldings,
    stockUnlocked,
    isFeatureUnlocked,
    buyStock,
    sellStock,
  } = useGameStore();

  const [selectedStockId, setSelectedStockId] = useState<string>(stockItems[0]?.id || "");
  const [quantity, setQuantity] = useState(1);
  const [tradeMessage, setTradeMessage] = useState<string | null>(null);

  const marketFeatureUnlocked = isFeatureUnlocked("stock-market");
  const marketUnlocked = marketFeatureUnlocked && stockUnlocked;

  const snapshots = useMemo<StockSnapshot[]>(() => {
    return stockItems.slice(0, 4).map((stock) => {
      const currentPrice = getPrice(stock, currentDay);
      const previousPrice = getPrice(stock, Math.max(1, currentDay - 1));
      const change = currentPrice - previousPrice;
      const changePercent = previousPrice > 0 ? (change / previousPrice) * 100 : 0;
      const direction = getDirection(currentPrice, previousPrice);

      const dailyNews = Array.isArray(stock.dailyNews) ? stock.dailyNews : [];
      const newsIndex = getLoopIndex(currentDay, Math.max(1, dailyNews.length));
      const todayNews = dailyNews[newsIndex] || "No major bulletin today.";

      const nextPrice = getPrice(stock, currentDay + 1);
      const projectedDirection = getDirection(nextPrice, currentPrice);

      return {
        stock,
        currentPrice,
        previousPrice,
        change,
        changePercent,
        direction,
        todayNews,
        projectedDirection,
      };
    });
  }, [stockItems, currentDay]);

  const activeStockId =
    snapshots.find((entry) => entry.stock.id === selectedStockId)?.stock.id || snapshots[0]?.stock.id || "";

  const selected = snapshots.find((entry) => entry.stock.id === activeStockId) || null;
  const selectedHolding = stockHoldings.find((holding) => holding.stockId === activeStockId) || null;
  const chartData = selected ? buildChartData(selected.stock, currentDay) : [];

  const holdingsRows = useMemo(() => {
    return stockHoldings
      .map((holding) => {
        const stock = snapshots.find((entry) => entry.stock.id === holding.stockId);
        if (!stock) return null;

        const marketValue = stock.currentPrice * holding.quantity;
        const profitLoss = marketValue - holding.totalInvested;

        return {
          stockId: holding.stockId,
          symbol: stock.stock.symbol,
          name: stock.stock.name,
          quantity: holding.quantity,
          averageBuyPrice: holding.averageBuyPrice,
          currentPrice: stock.currentPrice,
          marketValue,
          invested: holding.totalInvested,
          profitLoss,
        };
      })
      .filter((row): row is NonNullable<typeof row> => row !== null);
  }, [stockHoldings, snapshots]);

  if (!marketFeatureUnlocked) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
        <p className="text-sm font-black text-amber-800">🔒 Stock Investment Locked</p>
        <p className="mt-1 text-sm text-amber-700">
          Stock market opens only in the final phase.
        </p>
        <p className="mt-2 text-xs font-semibold text-amber-700">Current Phase: {currentPhase} / 9</p>
      </div>
    );
  }

  if (!marketUnlocked) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
        <p className="text-sm font-black text-amber-800">🔒 Market Access Pending</p>
        <p className="mt-1 text-sm text-amber-700">
          Reach Level {GAME_CONFIG.STOCK_UNLOCK_LEVEL} to trade stocks in final phase.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-sky-200 bg-gradient-to-r from-sky-50 via-cyan-50 to-blue-50 p-4">
        <p className="text-xs font-black uppercase tracking-[0.15em] text-sky-700">Stock Investment Desk</p>
        <p className="mt-1 text-sm text-sky-800">
          4 hardcoded stocks run on deterministic daily loops with fixed news sentiment.
        </p>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <div className="space-y-3">
          {snapshots.map((entry) => {
            const selectedCard = entry.stock.id === activeStockId;
            return (
              <motion.button
                key={entry.stock.id}
                whileHover={{ y: -2 }}
                onClick={() => setSelectedStockId(entry.stock.id)}
                className={`w-full rounded-2xl border p-3 text-left transition ${
                  selectedCard
                    ? "border-sky-400 bg-sky-50 shadow-sm"
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-black text-slate-900">{entry.stock.symbol}</p>
                    <p className="text-xs text-slate-600">{entry.stock.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-black text-slate-900">₹{entry.currentPrice}</p>
                    <p
                      className={`text-xs font-semibold ${
                        entry.change > 0
                          ? "text-emerald-600"
                          : entry.change < 0
                            ? "text-rose-600"
                            : "text-slate-600"
                      }`}
                    >
                      {entry.change >= 0 ? "+" : ""}
                      ₹{entry.change} ({entry.changePercent >= 0 ? "+" : ""}
                      {entry.changePercent.toFixed(1)}%)
                    </p>
                  </div>
                </div>
                <p className="mt-2 text-xs text-slate-600">{entry.todayNews}</p>
                <div
                  className={`mt-2 inline-flex rounded-lg border px-2 py-1 text-[11px] font-bold ${getDirectionTone(
                    entry.projectedDirection,
                  )}`}
                >
                  {getDirectionGlyph(entry.projectedDirection)} {getDirectionLabel(entry.projectedDirection)}
                </div>
              </motion.button>
            );
          })}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          {!selected ? (
            <p className="text-sm text-slate-600">No stock selected.</p>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                    {selected.stock.symbol}
                  </p>
                  <p className="text-lg font-black text-slate-900">{selected.stock.name}</p>
                </div>
                <p className="text-2xl font-black text-sky-700">₹{selected.currentPrice}</p>
              </div>

              <div className="mt-3 h-36 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <XAxis dataKey="day" tick={{ fontSize: 10 }} />
                    <YAxis hide domain={["dataMin - 4", "dataMax + 4"]} />
                    <Tooltip />
                    <Line
                      dataKey="price"
                      stroke="#0284c7"
                      strokeWidth={2.4}
                      dot={{ r: 2 }}
                      type="monotone"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                <p className="font-bold text-slate-800">Today&apos;s News</p>
                <p className="mt-1">{selected.todayNews}</p>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-amber-50 p-3">
                  <p className="text-xs font-bold text-amber-700">Wallet</p>
                  <p className="text-lg font-black text-amber-800">₹{player.wallet}</p>
                </div>
                <div className="rounded-xl bg-emerald-50 p-3">
                  <p className="text-xs font-bold text-emerald-700">You Hold</p>
                  <p className="text-lg font-black text-emerald-800">{selectedHolding?.quantity || 0} shares</p>
                </div>
              </div>

              <div className="mt-3 rounded-xl border border-slate-200 p-3">
                <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-600">Trade Quantity</p>
                <div className="mt-2 flex gap-2">
                  {[1, 3, 5, 10].map((q) => (
                    <button
                      key={q}
                      onClick={() => setQuantity(q)}
                      className={`rounded-lg px-3 py-2 text-xs font-bold ${
                        quantity === q
                          ? "bg-sky-600 text-white"
                          : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                      }`}
                    >
                      {q}
                    </button>
                  ))}
                  <input
                    type="number"
                    min={1}
                    value={quantity}
                    onChange={(event) => setQuantity(Math.max(1, parseInt(event.target.value, 10) || 1))}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-800"
                  />
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      const success = buyStock(selected.stock.id, quantity);
                      setTradeMessage(
                        success
                          ? `Bought ${quantity} ${selected.stock.symbol} @ ₹${selected.currentPrice}`
                          : "Buy failed. Check wallet and unlock status.",
                      );
                    }}
                    className="rounded-xl bg-emerald-600 px-3 py-2 text-sm font-black text-white hover:bg-emerald-700"
                  >
                    Buy (₹{selected.currentPrice * quantity})
                  </button>
                  <button
                    onClick={() => {
                      const success = sellStock(selected.stock.id, quantity);
                      setTradeMessage(
                        success
                          ? `Sold ${quantity} ${selected.stock.symbol} @ ₹${selected.currentPrice}`
                          : "Sell failed. Not enough shares.",
                      );
                    }}
                    className="rounded-xl bg-rose-600 px-3 py-2 text-sm font-black text-white hover:bg-rose-700"
                  >
                    Sell (₹{selected.currentPrice * quantity})
                  </button>
                </div>

                {tradeMessage && (
                  <p className="mt-2 text-xs font-semibold text-slate-700">{tradeMessage}</p>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-600">Stock Inventory</p>
        {holdingsRows.length === 0 ? (
          <p className="mt-2 text-sm text-slate-600">No stocks in portfolio yet. Buy from the trading panel.</p>
        ) : (
          <div className="mt-3 space-y-2">
            {holdingsRows.map((row) => (
              <div key={row.stockId} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-black text-slate-900">
                    {row.symbol} · {row.name}
                  </p>
                  <p
                    className={`text-sm font-black ${
                      row.profitLoss >= 0 ? "text-emerald-600" : "text-rose-600"
                    }`}
                  >
                    {row.profitLoss >= 0 ? "+" : ""}₹{Math.round(row.profitLoss)}
                  </p>
                </div>
                <p className="mt-1 text-xs text-slate-600">
                  Qty: {row.quantity} | Avg Buy: ₹{row.averageBuyPrice.toFixed(2)} | CMP: ₹{row.currentPrice}
                </p>
                <p className="mt-1 text-xs text-slate-600">
                  Invested: ₹{Math.round(row.invested)} | Value: ₹{Math.round(row.marketValue)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

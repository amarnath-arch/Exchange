import { Router } from "express";
import marketClient from "../../prisma.market";
import type { KLine } from "../../types/types";

const kLineRouter = Router();

kLineRouter.get("/", async (req, res) => {
  try {
    const { symbol, interval = "1m", startTime, endTime } = req.query;

    if (!symbol) {
      return res.status(400).json({ error: "symbol is required" });
    }

    const intervalMs = intervalToMs(interval as string);

    const start = startTime
      ? new Date(Number(startTime))
      : new Date(Date.now() - 24 * 60 * 60 * 1000);
    const end = endTime ? new Date(Number(endTime)) : new Date();

    const raw = await marketClient.kLine.findMany({
      where: {
        symbol: symbol as string,
        start: { gte: start, lte: end },
      },
      orderBy: { start: "asc" },
    });

    const klines: KLine[] = raw.map((row) => ({
      symbol: row.symbol,
      open: row.open,
      close: row.close,
      high: row.high,
      low: row.low,
      volume: row.volume,
      quoteVolume: row.quoteVolume,
      trades: row.trades,
      start: row.start.getTime().toString(),
      end: row.end.getTime().toString(),
    }));

    const result =
      interval === "1m" ? klines : aggregateCandles(klines, intervalMs);

    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({
      error: err,
    });
  }
});

function aggregateCandles(candles: KLine[], intervalMs: number): KLine[] {
  const buckets = new Map<number, KLine>();

  for (const candle of candles) {
    const bucketStart =
      Math.floor(Number(candle.start) / intervalMs) * intervalMs;

    if (!buckets.has(bucketStart)) {
      buckets.set(bucketStart, {
        symbol: candle.symbol,
        open: candle.open, // first candle's open
        close: candle.close,
        high: candle.high,
        low: candle.low,
        volume: candle.volume,
        quoteVolume: candle.quoteVolume,
        trades: candle.trades,
        start: String(bucketStart),
        end: String(bucketStart + intervalMs),
      });
    } else {
      const b = buckets.get(bucketStart)!;
      b.close = candle.close; // last candle's close
      b.high = String(Math.max(Number(b.high), Number(candle.high)));
      b.low = String(Math.min(Number(b.low), Number(candle.low)));
      b.volume = String(Number(b.volume) + Number(candle.volume));
      b.quoteVolume = String(
        Number(b.quoteVolume) + Number(candle.quoteVolume),
      );
      b.trades = String(Number(b.trades) + Number(candle.trades));
    }
  }

  return Array.from(buckets.values());
}

function intervalToMs(interval: string): number {
  const map: Record<string, number> = {
    "1m": 60 * 1000,
    "5m": 5 * 60 * 1000,
    "15m": 15 * 60 * 1000,
    "1h": 60 * 60 * 1000,
    "4h": 4 * 60 * 60 * 1000,
    "1d": 24 * 60 * 60 * 1000,
  };
  return map[interval] ?? 60 * 1000;
}

export default kLineRouter;

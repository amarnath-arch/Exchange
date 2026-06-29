export type Market = {
  symbol: string;
  base: string;
  quote: string;
  price: number;
  change: number;
  high: number;
  low: number;
  volume: number;
};

export const MARKETS: Market[] = [
  {
    symbol: "BTC/USDC",
    base: "BTC",
    quote: "USDC",
    price: 71284.42,
    change: 2.34,
    high: 72110,
    low: 69540,
    volume: 482_113_002,
  },
  {
    symbol: "ETH/USDC",
    base: "ETH",
    quote: "USDC",
    price: 3842.18,
    change: -0.82,
    high: 3920,
    low: 3795,
    volume: 218_904_551,
  },
  {
    symbol: "SOL/USDC",
    base: "SOL",
    quote: "USDC",
    price: 184.92,
    change: 5.61,
    high: 188.4,
    low: 172.3,
    volume: 198_443_120,
  },
  {
    symbol: "BONK/USDC",
    base: "BONK",
    quote: "USDC",
    price: 0.00003124,
    change: 12.4,
    high: 0.0000338,
    low: 0.0000278,
    volume: 88_123_004,
  },
  {
    symbol: "JUP/USDC",
    base: "JUP",
    quote: "USDC",
    price: 1.142,
    change: -3.21,
    high: 1.21,
    low: 1.11,
    volume: 42_004_881,
  },
  {
    symbol: "WIF/USDC",
    base: "WIF",
    quote: "USDC",
    price: 2.84,
    change: 8.92,
    high: 2.94,
    low: 2.55,
    volume: 61_009_223,
  },
  {
    symbol: "PYTH/USDC",
    base: "PYTH",
    quote: "USDC",
    price: 0.412,
    change: 1.04,
    high: 0.42,
    low: 0.395,
    volume: 18_220_341,
  },
  {
    symbol: "JTO/USDC",
    base: "JTO",
    quote: "USDC",
    price: 3.18,
    change: -1.42,
    high: 3.28,
    low: 3.08,
    volume: 22_551_009,
  },
  {
    symbol: "RNDR/USDC",
    base: "RNDR",
    quote: "USDC",
    price: 7.92,
    change: 4.21,
    high: 8.1,
    low: 7.42,
    volume: 31_550_881,
  },
  {
    symbol: "TIA/USDC",
    base: "TIA",
    quote: "USDC",
    price: 6.41,
    change: -2.08,
    high: 6.71,
    low: 6.32,
    volume: 19_882_311,
  },
];

export function fmt(n: number, d = 2) {
  if (n < 0.01 && n > 0) return n.toExponential(2);
  return n.toLocaleString("en-US", {
    minimumFractionDigits: d,
    maximumFractionDigits: d,
  });
}
export function fmtCompact(n: number) {
  return new Intl.NumberFormat("en", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(n);
}

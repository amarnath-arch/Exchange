"use client";

import Link from "next/link";
import { Nav } from "@/components/Nav";
import { MARKETS, fmt } from "@/lib/markets-data";

export default function Landing() {
  const top = MARKETS.slice(0, 6);
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.18]"
          style={{
            backgroundImage:
              "radial-gradient(600px circle at 20% 10%, oklch(0.82 0.14 200 / 0.35), transparent 60%), radial-gradient(700px circle at 80% 30%, oklch(0.78 0.17 155 / 0.18), transparent 60%)",
          }}
        />
        <div className="relative mx-auto max-w-[1600px] px-4 py-20 lg:px-6 lg:py-28">
          <div className="grid items-center gap-14 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <div className="chip mb-6">
                <span className="h-1.5 w-1.5 rounded-full bg-buy" />
                Live · 1.28B in 24h volume
              </div>
              <h1 className="text-4xl font-semibold leading-[1.05] tracking-tight md:text-6xl">
                Markets that move
                <br />
                at the <span className="text-primary">speed of light</span>.
              </h1>
              <p className="mt-6 max-w-xl text-base text-muted-foreground md:text-lg">
                Lumen is a centralized exchange for serious traders.
                Sub-millisecond matching, transparent fees, and a UI designed
                for screens that don't blink.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link href="/auth?mode=signup" className="btn-primary">
                  Open an account
                </Link>
                {/* <Link href="/trade" className="btn-ghost">
                  Try the terminal →
                </Link> */}
              </div>
              {/* <dl className="mt-12 grid max-w-md grid-cols-3 gap-6 border-t border-border pt-6">
                {[
                  ["Pairs", "240+"],
                  ["Fee", "0.02%"],
                  ["Latency", "<1ms"],
                ].map(([k, v]) => (
                  <div key={k}>
                    <dt className="text-xs uppercase tracking-wider text-muted-foreground">
                      {k}
                    </dt>
                    <dd className="num mt-1 text-xl font-semibold">{v}</dd>
                  </div>
                ))}
              </dl> */}
            </div>

            {/* Faux terminal preview */}
            <div className="surface-panel overflow-hidden">
              <div className="flex items-center justify-between border-b border-border px-4 py-2.5 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-sell/70" />
                  <span className="h-2 w-2 rounded-full bg-warning/70" />
                  <span className="h-2 w-2 rounded-full bg-buy/70" />
                </div>
                <span className="font-mono">BTC-USDC · LIVE</span>
              </div>
              <div className="grid grid-cols-[1fr_180px]">
                <div className="border-r border-border p-4">
                  <div className="flex items-baseline justify-between">
                    <div className="num text-3xl font-semibold">
                      {fmt.price(104238.42)}
                    </div>
                    <div className="num text-sm text-buy">+2.34%</div>
                  </div>
                  <Sparkline className="mt-4 h-32 w-full" />
                  <div className="mt-4 grid grid-cols-4 gap-3 text-xs">
                    {[
                      ["24h High", "105,120"],
                      ["24h Low", "101,800"],
                      ["24h Vol", "1.28B"],
                      ["Funding", "+0.012%"],
                    ].map(([k, v]) => (
                      <div key={k}>
                        <div className="text-muted-foreground">{k}</div>
                        <div className="num mt-0.5 font-medium">{v}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="p-3 text-xs">
                  <div className="mb-2 font-mono text-muted-foreground">
                    Order Book
                  </div>
                  <ul className="space-y-0.5">
                    {[104250, 104248, 104245, 104242, 104240].map((p, i) => (
                      <li
                        key={p}
                        className="num flex justify-between text-sell"
                      >
                        <span>{p.toLocaleString()}</span>
                        <span>{(0.412 - i * 0.04).toFixed(3)}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="my-2 num text-center text-sm font-semibold">
                    {fmt.price(104238.42)}
                  </div>
                  <ul className="space-y-0.5">
                    {[104236, 104232, 104228, 104225, 104220].map((p, i) => (
                      <li key={p} className="num flex justify-between text-buy">
                        <span>{p.toLocaleString()}</span>
                        <span>{(0.218 + i * 0.05).toFixed(3)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Ticker strip */}
      <section className="border-b border-border bg-surface/40">
        <div className="mx-auto max-w-[1600px] px-4 py-4 lg:px-6">
          <h2 className="sr-only">Top markets</h2>
          <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg bg-border md:grid-cols-3 lg:grid-cols-6">
            {top.map((m) => (
              <Link
                key={m.symbol}
                href={`/trade/${m.symbol.split("-").join("_")}`}
                className="flex items-center justify-between bg-background px-4 py-3 transition-colors hover:bg-surface"
              >
                <div>
                  <div className="text-xs text-muted-foreground">
                    {m.base}/{m.quote}
                  </div>
                  <div className="num mt-0.5 text-sm font-semibold">
                    {fmt.price(m.price)}
                  </div>
                </div>
                <div
                  className={`num text-xs font-medium ${m.change24h >= 0 ? "text-buy" : "text-sell"}`}
                >
                  {fmt.pct(m.change24h)}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-[1600px] px-4 py-20 lg:px-6">
          <div className="mb-12 max-w-2xl">
            <div className="chip mb-4">The terminal</div>
            <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
              Built by traders, for the trades you actually place.
            </h2>
          </div>
          <div className="grid gap-px overflow-hidden rounded-lg bg-border md:grid-cols-3">
            {[
              {
                t: "Deep order books",
                d: "Aggregated liquidity from our maker network keeps spreads tight even in volatile sessions.",
                k: "01",
              },
              {
                t: "Cross-margin perps",
                d: "Up to 50× on majors with portfolio margin and adaptive funding rates.",
                k: "02",
              },
              {
                t: "API-first",
                d: "REST and WebSocket APIs with FIX gateway available for institutional desks.",
                k: "03",
              },
              {
                t: "Self-custody bridge",
                d: "Withdraw to your own wallet with one-click and zero withdrawal fees on USDC.",
                k: "04",
              },
              {
                t: "Transparent fees",
                d: "Flat 0.02% maker / 0.06% taker. No surprise spreads, no payment-for-order-flow.",
                k: "05",
              },
              {
                t: "Insurance fund",
                d: "$240M segregated insurance fund. Proof-of-reserves published monthly.",
                k: "06",
              },
            ].map((f) => (
              <div key={f.k} className="bg-background p-6">
                <div className="num text-xs text-muted-foreground">{f.k}</div>
                <h3 className="mt-3 text-base font-semibold">{f.t}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{f.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-[1600px] px-4 py-20 lg:px-6">
          <div className="surface-panel flex flex-col items-start justify-between gap-6 p-10 md:flex-row md:items-center">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
                Open the terminal.
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Two-minute signup. No KYC required for spot under $10K daily.
              </p>
            </div>
            <div className="flex gap-3">
              <Link href="/markets" className="btn-ghost">
                Browse markets
              </Link>
              <Link href="/auth?mode=signup" className="btn-primary">
                Create account
              </Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="mx-auto max-w-[1600px] px-4 py-8 text-xs text-muted-foreground lg:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>© 2026 Lumen Labs · Not investment advice.</div>
          <div className="flex gap-4">
            <a href="#" className="hover:text-foreground">
              Docs
            </a>
            <a href="#" className="hover:text-foreground">
              API
            </a>
            <a href="#" className="hover:text-foreground">
              Status
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function Sparkline({ className }: { className?: string }) {
  const pts = [
    12, 18, 14, 22, 19, 28, 24, 32, 29, 38, 34, 42, 40, 48, 44, 52, 50, 58, 54,
    62, 60, 68, 64, 72,
  ];
  const max = Math.max(...pts),
    min = Math.min(...pts);
  const path = pts
    .map((v, i) => {
      const x = (i / (pts.length - 1)) * 100;
      const y = 100 - ((v - min) / (max - min)) * 100;
      return `${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className={className}>
      <defs>
        <linearGradient id="spark" x1="0" x2="0" y1="0" y2="1">
          <stop
            offset="0%"
            stopColor="oklch(0.78 0.17 155)"
            stopOpacity="0.4"
          />
          <stop
            offset="100%"
            stopColor="oklch(0.78 0.17 155)"
            stopOpacity="0"
          />
        </linearGradient>
      </defs>
      <path d={`${path} L100,100 L0,100 Z`} fill="url(#spark)" />
      <path
        d={path}
        fill="none"
        stroke="oklch(0.78 0.17 155)"
        strokeWidth="1.2"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

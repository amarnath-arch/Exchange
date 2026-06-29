"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Nav } from "@/components/Nav";
import { MARKETS, fmt } from "@/lib/markets-data";
import { useRouter } from "next/navigation";

type Tab = "all" | "gainers" | "losers" | "volume";
type Sort = {
  key: "price" | "change24h" | "volume24h" | "marketCap" | "symbol";
  dir: "asc" | "desc";
};

export default function MarketsPage() {
  const [tab, setTab] = useState<Tab>("all");
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<Sort>({ key: "volume24h", dir: "desc" });
  const router = useRouter();

  const rows = useMemo(() => {
    let list = MARKETS.filter(
      (m) =>
        m.symbol.toLowerCase().includes(q.toLowerCase()) ||
        m.name.toLowerCase().includes(q.toLowerCase()),
    );
    if (tab === "gainers")
      list = [...list].sort((a, b) => b.change24h - a.change24h).slice(0, 10);
    if (tab === "losers")
      list = [...list].sort((a, b) => a.change24h - b.change24h).slice(0, 10);
    if (tab === "volume")
      list = [...list].sort((a, b) => b.volume24h - a.volume24h);
    if (tab === "all") {
      list = [...list].sort((a, b) => {
        const mul = sort.dir === "asc" ? 1 : -1;
        const av = a[sort.key],
          bv = b[sort.key];
        if (typeof av === "string")
          return mul * (av as string).localeCompare(bv as string);
        return mul * ((av as number) - (bv as number));
      });
    }
    return list;
  }, [tab, q, sort]);

  const toggleSort = (key: Sort["key"]) =>
    setSort((s) =>
      s.key === key
        ? { key, dir: s.dir === "asc" ? "desc" : "asc" }
        : { key, dir: "desc" },
    );

  return (
    <div className="min-h-screen">
      <main className="mx-auto max-w-[1600px] px-4 py-10 lg:px-6">
        {/* Header */}
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
              Markets
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              240+ pairs · Updated in real time
            </p>
          </div>
          <div className="grid grid-cols-3 gap-px overflow-hidden rounded-lg bg-border text-xs">
            {[
              [
                "24h Volume",
                fmt.vol(MARKETS.reduce((a, m) => a + m.volume24h, 0)),
              ],
              ["Pairs", "240"],
              ["Active traders", "184,210"],
            ].map(([k, v]) => (
              <div key={k} className="bg-background px-5 py-3">
                <div className="text-muted-foreground">{k}</div>
                <div className="num mt-0.5 text-sm font-semibold">{v}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Controls */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-1 rounded-md border border-border bg-surface p-1 text-sm">
            {(
              [
                ["all", "All"],
                ["gainers", "Gainers"],
                ["losers", "Losers"],
                ["volume", "Top Volume"],
              ] as [Tab, string][]
            ).map(([k, l]) => (
              <button
                key={k}
                onClick={() => setTab(k)}
                className={`rounded px-3 py-1.5 transition-colors ${
                  tab === k
                    ? "bg-surface-3 text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {l}
              </button>
            ))}
          </div>
          <div className="relative">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search markets…"
              className="w-72 rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus:border-primary"
            />
          </div>
        </div>

        {/* Table */}
        <div className="surface-panel overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <Th
                    onClick={() => toggleSort("symbol")}
                    sortKey="symbol"
                    sort={sort}
                  >
                    Market
                  </Th>
                  <Th
                    onClick={() => toggleSort("price")}
                    sortKey="price"
                    sort={sort}
                    right
                  >
                    Last Price
                  </Th>
                  <Th
                    onClick={() => toggleSort("change24h")}
                    sortKey="change24h"
                    sort={sort}
                    right
                  >
                    24h %
                  </Th>
                  <th className="py-3 pr-6 text-right">24h High</th>
                  <th className="py-3 pr-6 text-right">24h Low</th>
                  <Th
                    onClick={() => toggleSort("volume24h")}
                    sortKey="volume24h"
                    sort={sort}
                    right
                  >
                    24h Volume
                  </Th>
                  <Th
                    onClick={() => toggleSort("marketCap")}
                    sortKey="marketCap"
                    sort={sort}
                    right
                  >
                    Market Cap
                  </Th>
                  {/* <th className="py-3 pr-4 text-right">Trade</th> */}
                </tr>
              </thead>
              <tbody>
                {rows.map((m) => (
                  <tr
                    key={m.symbol.split("-").join("_")}
                    className="group border-b border-border/60 transition-colors last:border-0 hover:bg-surface-2/40 cursor-pointer hover:scale-101 hover:-transalate-y-0.5 transition-all duration-500 ease-in-out"
                    onClick={() => {
                      router.push(`/trade/${m.symbol.split("-").join("_")}`);
                    }}
                  >
                    <td className="py-3.5 pl-4 pr-6">
                      <div className="flex items-center gap-3">
                        <div className="grid h-8 w-8 place-items-center rounded-full bg-surface-3 text-xs font-bold">
                          {m.base.slice(0, 2)}
                        </div>
                        <div>
                          <div className="font-medium">
                            {m.base}
                            <span className="text-muted-foreground">
                              /{m.quote}
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {m.name}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="num py-3.5 pr-6 text-right font-medium">
                      {fmt.price(m.price)}
                    </td>
                    <td
                      className={`num py-3.5 pr-6 text-right font-medium ${m.change24h >= 0 ? "text-buy" : "text-sell"}`}
                    >
                      {fmt.pct(m.change24h)}
                    </td>
                    <td className="num py-3.5 pr-6 text-right text-muted-foreground">
                      {fmt.price(m.high24h)}
                    </td>
                    <td className="num py-3.5 pr-6 text-right text-muted-foreground">
                      {fmt.price(m.low24h)}
                    </td>
                    <td className="num py-3.5 pr-6 text-right">
                      {fmt.vol(m.volume24h)}
                    </td>
                    <td className="num py-3.5 pr-6 text-right text-muted-foreground">
                      {fmt.vol(m.marketCap)}
                    </td>
                    {/* <td className="py-3.5 pr-4 text-right">
                      <Link
                        href="/trade"
                        className="inline-flex items-center rounded-md border border-border bg-surface-2 px-3 py-1.5 text-xs font-medium opacity-70 transition-opacity hover:opacity-100"
                      >
                        Trade →
                      </Link>
                    </td> */}
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td
                      colSpan={8}
                      className="py-16 text-center text-sm text-muted-foreground"
                    >
                      No markets match "{q}"
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}

function Th({
  children,
  onClick,
  sortKey,
  sort,
  right,
}: {
  children: React.ReactNode;
  onClick: () => void;
  sortKey: Sort["key"];
  sort: Sort;
  right?: boolean;
}) {
  const active = sort.key === sortKey;
  return (
    <th className={`py-3 ${right ? "pr-6 text-right" : "pl-4 pr-6"}`}>
      <button
        onClick={onClick}
        className={`inline-flex items-center gap-1 transition-colors hover:text-foreground ${active ? "text-foreground" : ""}`}
      >
        {children}
        <span className="text-[10px]">
          {active ? (sort.dir === "asc" ? "↑" : "↓") : ""}
        </span>
      </button>
    </th>
  );
}

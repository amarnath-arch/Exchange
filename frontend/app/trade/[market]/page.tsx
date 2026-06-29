"use client";
import { getOpenOrders } from "@/app/utils/httpClient";
import { Depth } from "@/components/depth/Depth";
import { MarketBar } from "@/components/MarketBar";
import { SwapUI } from "@/components/Swap";
import { TradeView } from "@/components/TradeView";
import { useAuth } from "@/context/useAuth";
import { Order } from "@/lib/types";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function () {
  const { market } = useParams();
  const { isLoggedIn } = useAuth();

  return (
    <div className="flex">
      <div className="flex flex-col flex-1 ml-4">
        <MarketBar market={market as string} />
        <div className="flex border-y border-slate-800">
          <div className="flex flex-col flex-1">
            <TradeView market={market as string} />
          </div>
          <div className="flex flex-col w-[250px] overflow-hidden">
            <Depth market={market as string} />
          </div>
        </div>
        <div>
          <OpenOrders market={market as string} />
        </div>
      </div>
      <div></div>
      <div className="w-110 flex flex-col mx-3">
        <SwapUI market={market as string} />
      </div>
    </div>
  );
}

function OpenOrders({ market }: { market: string }) {
  const { isLoggedIn } = useAuth();

  const [orders, setOpenOrders] = useState<Order[]>([]);

  useEffect(() => {
    async function init() {
      try {
        const openOrders = await getOpenOrders(market);
        setOpenOrders(openOrders);
      } catch (err) {
        console.log(err);
      }
    }

    init();
  }, []);

  const [tab, setTab] = useState<"open" | "history" | "balances">("open");
  return (
    <section className="surface-panel overflow-hidden">
      <div className="flex gap-1 border-b border-border px-3 py-2 text-xs">
        {(["open", "history", "balances"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded px-3 py-1.5 capitalize ${tab === t ? "bg-surface-3 text-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            {t === "open" ? "Open Orders (0)" : t}
          </button>
        ))}
      </div>

      {!isLoggedIn ? (
        <div className="grid place-items-center py-12 text-sm text-muted-foreground">
          {tab === "open" && (
            <span>
              No open orders.{" "}
              <Link href="/auth" className="text-primary hover:underline">
                Sign in
              </Link>{" "}
              to start trading.
            </span>
          )}
          {tab === "history" && "No order history."}
          {tab === "balances" && "Connect your account to view balances."}
        </div>
      ) : (
        <>
          {tab === "open" &&
            (orders.length === 0 ? (
              <div className="grid place-items-center py-12 text-sm text-muted-foreground">
                No open orders yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                      <th className="py-2.5 pl-4 pr-4 font-medium">Market</th>
                      <th className="py-2.5 pr-4 font-medium">Side</th>
                      <th className="py-2.5 pr-4 font-medium">Type</th>
                      <th className="py-2.5 pr-4 text-right font-medium">
                        Price
                      </th>
                      <th className="py-2.5 pr-4 text-right font-medium">
                        Amount
                      </th>
                      <th className="py-2.5 pr-4 text-right font-medium">
                        Filled
                      </th>
                      <th className="py-2.5 pr-4 text-right font-medium">
                        Status
                      </th>
                      <th className="py-2.5 pr-4 text-right font-medium">
                        Time
                      </th>
                      <th className="py-2.5 pr-4 text-right font-medium"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((o) => (
                      <tr
                        key={o.orderId}
                        className="border-b border-border/60 transition-colors last:border-0 hover:bg-surface-2/40"
                      >
                        <td className="py-3 pl-4 pr-4 font-medium">
                          {o.market}
                        </td>
                        <td className="py-3 pr-4">
                          <span
                            className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium uppercase ${
                              o.side === "buy"
                                ? "bg-buy-soft text-buy"
                                : "bg-sell-soft text-sell"
                            }`}
                          >
                            {o.side}
                          </span>
                        </td>
                        <td className="py-3 pr-4 capitalize text-muted-foreground">
                          {o.type}
                        </td>
                        <td className="num py-3 pr-4 text-right">{o.price}</td>
                        <td className="num py-3 pr-4 text-right">
                          {o.quantity}
                        </td>
                        <td className="num py-3 pr-4 text-right text-muted-foreground">
                          {o.filled}
                        </td>
                        <td className="py-3 pr-4 pl-3 text-right">
                          <span
                            className={`inline-flex items-center gap-1.5 text-xs ${
                              o.filled != 0
                                ? "text-muted-foreground"
                                : "text-warning"
                            }`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${
                                o.filled != 0
                                  ? "bg-muted-foreground"
                                  : "bg-warning"
                              }`}
                            />
                            {o.filled > 0
                              ? o.quantity - o.filled > 0
                                ? "Partial"
                                : "Filled"
                              : "Open"}
                          </span>
                        </td>
                        <td className="num py-3 pr-4 text-right text-muted-foreground">
                          {new Date(Number(o.timestamp)).toLocaleString()}
                        </td>
                        {/* <td className="py-3 pr-4 text-right">
                          <button className="rounded-md border border-border bg-surface-2 px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:border-sell/50 hover:text-sell">
                            Cancel
                          </button>
                        </td> */}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}

          {tab === "history" && (
            <div className="grid place-items-center py-12 text-sm text-muted-foreground">
              No order history yet.
            </div>
          )}

          {tab === "balances" && (
            <div className="grid place-items-center py-12 text-sm text-muted-foreground">
              No balances to show.
            </div>
          )}
        </>
      )}
    </section>
  );
}

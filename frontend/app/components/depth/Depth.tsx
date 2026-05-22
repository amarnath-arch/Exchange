"use client";

import { useEffect, useState } from "react";
import {
  getDepth,
  getKlines,
  getTicker,
  getTrades,
} from "../../utils/httpClient";
import { BidTable } from "./BidTable";
import { AskTable } from "./AskTable";
import SocketManager from "@/app/utils/Socket";

const applyOrderBookUpdates = (
  original: [string, string][],
  updates: [string, string][],
): [string, string][] => {
  const map = new Map(original ?? []);

  for (const [price, qty] of updates) {
    if (parseFloat(qty) === 0) {
      map.delete(price);
    } else {
      map.set(price, qty);
    }
  }

  return Array.from(map.entries());
};

export function Depth({ market }: { market: string }) {
  const [bids, setBids] = useState<[string, string][]>();
  const [asks, setAsks] = useState<[string, string][]>();
  const [price, setPrice] = useState<string>();

  useEffect(() => {
    const init = async () => {
      SocketManager.getInstance().registerCallback(
        "depth",
        (data: any) => {
          setBids((original) =>
            applyOrderBookUpdates(original ?? [], data.bids),
          );
          setAsks((original) =>
            applyOrderBookUpdates(original ?? [], data.asks),
          );
        },
        `${market}`,
      );

      SocketManager.getInstance().sendMessage({
        method: "SUBSCRIBE",
        params: [`depth.${market}`],
      });

      let depthData = await getDepth(market);
      const tickerData = await getTicker(market);

      setBids(depthData.bids.reverse());
      setAsks(depthData.asks);
      setPrice(tickerData.lastPrice);

      console.log("bids are : ", depthData.bids);

      console.log("ticker data : ", tickerData);
    };

    init();

    return () => {
      SocketManager.getInstance().sendMessage({
        method: "UNSUBSCRIBE",
        params: [`depth.200ms.${market}`],
      });
      SocketManager.getInstance().deregisterCallback("depth", `${market}`);
    };
  }, []);

  return (
    <div>
      <TableHeader />
      {asks && <AskTable asks={asks} />}
      {price && <div>{price}</div>}
      {bids && <BidTable bids={bids} />}
    </div>
  );
}

function TableHeader() {
  return (
    <div className="flex justify-between text-xs">
      <div className="text-white">Price</div>
      <div className="text-slate-500">Size</div>
      <div className="text-slate-500">Total</div>
    </div>
  );
}

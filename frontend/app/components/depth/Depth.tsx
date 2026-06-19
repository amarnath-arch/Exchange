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
import { Ticker } from "@/app/utils/types";

const applyOrderBookUpdates = (
  original: [string, string][],
  updates: [string, string][],
  side: string,
): [string, string][] => {
  const map = new Map<string, string>(
    (original ?? []).map(([price, qty]) => [String(price), String(qty)]),
  );

  for (const [price, qty] of updates) {
    if (parseFloat(qty) === 0) {
      map.delete(price);
    } else {
      map.set(price, qty);
    }
  }

  // sort the entries according to price

  return Array.from(map.entries()).sort(
    ([a], [b]) => parseFloat(b) - parseFloat(a),
  );

  // return Array.from(map.entries()).sort(
  //   ([a], [b]) =>
  //     side === "bids"
  //       ? parseFloat(b) - parseFloat(a) // descending for bids
  //       : parseFloat(a) - parseFloat(b), // ascending for asks
  // );
};

export function Depth({ market }: { market: string }) {
  const [bids, setBids] = useState<[string, string][]>();
  const [asks, setAsks] = useState<[string, string][]>();
  const [price, setPrice] = useState<string>();

  useEffect(() => {
    const init = async () => {
      console.log("depth data before: ", "nothing");

      let depthData = await getDepth(market);
      try {
        const tickerData = await getTicker(market);
        setPrice(tickerData.lastPrice);
        console.log("ticker data : ", tickerData);
      } catch (err) {
        console.error(err);
      }

      console.log("depth data: ", depthData);

      setBids(depthData.bids?.reverse());
      setAsks(depthData.asks?.reverse());

      SocketManager.getInstance().registerCallback(
        "ticker",
        (data: Partial<Ticker>) => {
          setPrice((prevPrice) => data.lastPrice ?? prevPrice ?? "");
        },
        `${market}`,
        "DepthTable",
      );

      SocketManager.getInstance().registerCallback(
        "depth",
        (data: any) => {
          setBids((original) =>
            applyOrderBookUpdates(original ?? [], data.bids, "bids"),
          );
          setAsks((original) =>
            applyOrderBookUpdates(original ?? [], data.asks, "asks"),
          );
        },
        `${market}`,
        "DepthTable",
      );

      SocketManager.getInstance().sendMessage({
        method: "SUBSCRIBE",
        params: [`depth@${market}`],
      });

      console.log("bids are : ", depthData.bids);
    };

    init();

    return () => {
      SocketManager.getInstance().sendMessage({
        method: "UNSUBSCRIBE",
        params: [`depth@${market}`],
      });
      SocketManager.getInstance().deregisterCallback(
        "depth",
        `${market}`,
        "DepthTable",
      );
      SocketManager.getInstance().deregisterCallback(
        "ticker",
        `${market}`,
        "DepthTable",
      );
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

"use client";
import { useEffect, useState } from "react";
import { type Ticker } from "../app/utils/types";
import TickerComponent from "./Ticker";
import { getTicker } from "../app/utils/httpClient";
import SocketManager from "../app/utils/Socket";
// import { type Ticker } from "../utils/types";
// import { getTicker } from "../utils/httpClient";
// import { SignalingManager } from "../utils/SignalingManager";

export const MarketBar = ({ market }: { market: string }) => {
  const [ticker, setTicker] = useState<Ticker | null>(null);

  useEffect(() => {
    const init = async () => {
      const tickerData = await getTicker(market);
      setTicker(tickerData);

      SocketManager.getInstance().registerCallback(
        "ticker",
        (data: Partial<Ticker>) =>
          setTicker((prevTicker) => ({
            firstPrice: data?.firstPrice ?? prevTicker?.firstPrice ?? "",
            high: data?.high ?? prevTicker?.high ?? "",
            lastPrice: data?.lastPrice ?? prevTicker?.lastPrice ?? "",
            low: data?.low ?? prevTicker?.low ?? "",
            priceChange: data?.priceChange ?? prevTicker?.priceChange ?? "",
            priceChangePercent:
              data?.priceChangePercent ?? prevTicker?.priceChangePercent ?? "",
            quoteVolume: data?.quoteVolume ?? prevTicker?.quoteVolume ?? "",
            symbol: data?.symbol ?? prevTicker?.symbol ?? "",
            trades: data?.trades ?? prevTicker?.trades ?? "",
            volume: data?.volume ?? prevTicker?.volume ?? "",
            updateTimestamp:
              data?.updateTimestamp ?? prevTicker?.updateTimestamp ?? 0,
          })),
        `${market}`,
        "MarketBar",
      );

      SocketManager.getInstance().sendMessage({
        method: "SUBSCRIBE",
        params: [`ticker@${market}`],
      });
    };

    init();

    return () => {
      SocketManager.getInstance().deregisterCallback(
        "ticker",
        `${market}`,
        "MarketBar",
      );
      SocketManager.getInstance().sendMessage({
        method: "UNSUBSCRIBE",
        params: [`ticker.${market}`],
      });
    };
  }, [market]);
  //

  return (
    <div>
      <div className="flex items-center relative w-full overflow-hidden border-b border-slate-800 bg-[#14151b] rounded-2xl shadow-xl">
        <div className="flex items-center justify-between flex-row no-scrollbar overflow-auto pr-4">
          <TickerComponent market={market} />
          <div className="flex items-center flex-row space-x-8 pl-4">
            <div className="flex flex-col h-full justify-center">
              <p
                className={`font-medium tabular-nums text-greenText text-md text-green-500`}
              >
                ${ticker?.lastPrice}
              </p>
              <p className="font-medium text-sm text-sm tabular-nums">
                ${ticker?.lastPrice}
              </p>
            </div>
            <div className="flex flex-col">
              <p className={`font-medium text-xs text-slate-400 text-sm`}>
                24H Change
              </p>
              <p
                className={` text-sm font-medium tabular-nums leading-5 text-sm text-greenText ${Number(ticker?.priceChange) > 0 ? "text-green-500" : "text-red-500"}`}
              >
                {Number(ticker?.priceChange) > 0 ? "+" : ""}{" "}
                {ticker?.priceChange}{" "}
                {Number(ticker?.priceChangePercent)?.toFixed(2)}%
              </p>
            </div>
            <div className="flex flex-col">
              <p className="font-medium text-xs text-slate-400 text-sm">
                24H High
              </p>
              <p className="text-sm font-medium tabular-nums leading-5 text-sm ">
                {ticker?.high}
              </p>
            </div>
            <div className="flex flex-col">
              <p className="font-medium text-xs text-slate-400 text-sm">
                24H Low
              </p>
              <p className="text-sm font-medium tabular-nums leading-5 text-sm ">
                {ticker?.low}
              </p>
            </div>
            <button
              type="button"
              className="font-medium transition-opacity hover:opacity-80 hover:cursor-pointer text-base text-left"
              data-rac=""
            >
              <div className="flex flex-col">
                <p className="font-medium text-xs text-slate-400 text-sm">
                  24H Volume
                </p>
                <p className="mt-1 text-sm font-medium tabular-nums leading-5 text-sm ">
                  {ticker?.volume}
                </p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

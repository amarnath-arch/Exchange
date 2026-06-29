"use client";
import { useEffect, useRef } from "react";
import { ChartManager } from "../app/utils/chartManager";
import { KLine } from "../app/utils/types";
import { getKlines } from "../app/utils/httpClient";
import SocketManager from "../app/utils/Socket";

export function TradeView({ market }: { market: string }) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartManagerRef = useRef<ChartManager>(null);

  useEffect(() => {
    const init = async () => {
      let klineData: KLine[] = [];
      try {
        klineData = await getKlines(
          market,
          "1h",
          Math.floor(new Date().getTime() - 1000 * 60 * 60 * 24 * 30),
          Math.floor(new Date().getTime()),
        );
      } catch (e) {}

      if (chartRef) {
        if (chartManagerRef.current) {
          chartManagerRef.current.destroy();
        }

        const mapped = (klineData ?? [])
          .map((x) => ({
            close: parseFloat(x.close),
            high: parseFloat(x.high),
            low: parseFloat(x.low),
            open: parseFloat(x.open),
            timestamp: new Date(Number(x.end)),
          }))
          .filter((x) => !isNaN(x.timestamp.getTime())) // drop bad rows
          .sort((a, b) => (a.timestamp < b.timestamp ? -1 : 1));

        console.log("klineData:", JSON.stringify(klineData));
        console.log("LAST mapped candle:", mapped[mapped.length - 1]);
        console.log(
          "LAST candle timestamp type:",
          typeof mapped[mapped.length - 1]?.timestamp,
        );

        const chartManager = new ChartManager(chartRef.current, mapped, {
          background: "#0e0f14",
          color: "white",
        });
        console.log("Chart Manager");
        console.log(chartManager);
        //@ts-ignore
        chartManagerRef.current = chartManager;

        // SocketManager.getInstance().registerCallback(
        //   "kline",
        //   (data: any) => {
        //     console.log("updating the kline chart");
        //     chartManagerRef.current?.update({
        //       open: parseFloat(data.o),
        //       high: parseFloat(data.h),
        //       low: parseFloat(data.l),
        //       close: parseFloat(data.c),
        //       newCandleInitiated: data.newCandleInitiated ?? false,
        //       time: Number(data.end) / 1000,
        //     });
        //   },
        //   `${market}`,
        //   "TradeView",
        // );

        // SocketManager.getInstance().sendMessage({
        //   method: "SUBSCRIBE",
        //   params: [`kline@${market}`],
        // });
      }
    };
    init();

    // return () => {
    //   SocketManager.getInstance().sendMessage({
    //     method: "UNSUBSCRIBE",
    //     params: [`kline@${market}`],
    //   });
    //   SocketManager.getInstance().deregisterCallback(
    //     "kline",
    //     `${market}`,
    //     "TradeView",
    //   );
    // };
  }, [market, chartRef]);

  return (
    <>
      <div
        ref={chartRef}
        style={{ height: "520px", width: "100%", marginTop: 4 }}
      ></div>
    </>
  );
}

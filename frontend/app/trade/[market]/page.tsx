"use client";
import { Depth } from "@/app/components/depth/Depth";
import { MarketBar } from "@/app/components/MarketBar";
import { SwapUI } from "@/app/components/Swap";
import { TradeView } from "@/app/components/TradeView";
import { useParams } from "next/navigation";

export default function () {
  const { market } = useParams();

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
      </div>
      <div></div>
      <div className="w-110 flex flex-col mx-3">
        <SwapUI market={market as string} />
      </div>
    </div>
  );
}

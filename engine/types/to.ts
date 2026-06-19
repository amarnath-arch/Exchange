import type { Order } from "../trade/Orderbook";

export const TRADE_ADDED = "TRADE_ADDED";
export const ORDER_UPDATE = "ORDER_UPDATE";
export const KLINE_UPDATE = "KLINE_UPDATE";

export type DbMessage =
  | {
      type: typeof TRADE_ADDED;
      data: {
        id: string;
        isBuyerMaker: boolean;
        makerOrderId: string;
        takerOrderId: string;
        price: string;
        quantity: string;
        quoteQuantity: string;
        timestamp: number;
        market: string;
      };
    }
  | {
      type: typeof ORDER_UPDATE;
      data: {
        orderId: string;
        executedQty: number;
        market?: string;
        price?: string;
        quantity?: string;
        side?: "buy" | "sell";
        timestamp?: number;
        userId?: string;
      };
    }
  | {
      type: typeof KLINE_UPDATE;
      data: {
        market: string;
        price: string;
        quantity: string;
        quoteQuantity: string;
        start: string;
        end: string;
        timestamp: number;
      };
    };

export type MessageToApi =
  | {
      type: "ORDER_PLACED";
      payload: {
        executedQty: number;
        fills: {
          price: string;
          quantity: number;
          tradeId: number;
        }[];
        orderId: string;
      };
    }
  | {
      type: "ORDER_CANCELLED";
      payload: {
        executedQty: number;
        remainingQty: number;
        orderId: string;
      };
    }
  | {
      type: "OPEN_ORDERS";
      payload: Order[];
    }
  | {
      type: "DEPTH";
      payload: {
        asks: [number, number][];
        bids: [number, number][];
      };
    }
  | {
      type: "TICKER";
      payload: {
        firstPrice: string;
        high: string;
        lastPrice: string;
        low: string;
        priceChange: string;
        priceChangePercent: string;
        quoteVolume: string;
        symbol: string;
        trades: string;
        volume: string;
        updateTimestamp: number;
      };
    }
  | {
      type: "ON_RAMP";
      payload: {
        amount: number;
        userId: string;
        asset: string;
      };
    };

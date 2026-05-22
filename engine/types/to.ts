import type { Order } from "../trade/Orderbook";

export const TRADE_ADDED = "TRADE_ADDED";
export const ORDER_UPDATE = "ORDER_UPDATE";

export type DbMessage =
  | {
      type: typeof TRADE_ADDED;
      data: {
        id: string;
        isBuyerMaker: boolean;
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
    };

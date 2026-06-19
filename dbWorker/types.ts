export const KLINE_UPDATE = "KLINE_UPDATE";
export const TRADE_ADDED = "TRADE_ADDED";
export const ORDER_UPDATE = "ORDER_UPDATE";

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

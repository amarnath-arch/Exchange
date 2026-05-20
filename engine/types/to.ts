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
    };

export const CREATE_ORDER = "CREATE_ORDER";
export const CANCEL_ORDER = "CANCEL_ORDER";
export const ON_RAMP = "ON_RAMP";
export const GET_OPEN_ORDERS = "GET_OPEN_ORDERS";

export const GET_DEPTH = "GET_DEPTH";

export type MessageToEngine = {
  type: typeof CREATE_ORDER;
  data: {
    market: string;
    price: string;
    quantity: string;
    side: "buy" | "sell";
    userId: string;
  };
};

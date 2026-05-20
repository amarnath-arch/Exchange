export const CREATE_ORDER = "CREATE_ORDER";
export const CANCEL_ORDER = "CANCEL_ORDER";
export const ON_RAMP = "ON_RAMP";

export const GET_DEPTH = "GET_DEPTH";
export const GET_OPEN_ORDERS = "GET_OPEN_ORDERS";

export type MessageFromApi = {
  type: typeof CREATE_ORDER;
  data: {
    price: string;
    quantity: string;
    market: string;
    side: "buy" | "sell";
    userId: string;
  };
};

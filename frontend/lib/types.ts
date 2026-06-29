export interface Order {
  price: number;
  quantity: number;
  filled: number;
  side: "buy" | "sell";
  userId: string;
  orderId: string;
  timestamp: number;
  market: string;
  type: "limit" | "market";
}

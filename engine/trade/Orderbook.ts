export interface Order {
  price: number;
  quantity: number;
  filled: number;
  side: "buy" | "sell";
  userId: string;
  orderId: string;
  timestamp: number;
}

export interface Fill {
  price: number;
  quantity: number;
  tradeId: number;
  otherUserId: string;
  makerOrderId: string;
}

export class Orderbook {
  bids: Order[];
  asks: Order[];
  quoteAsset: string;
  baseAsset: string;
  lastTradeId: number;

  deletedBidPrices: Set<number>;
  deletedAskPrices: Set<number>;

  constructor(
    bids: Order[],
    asks: Order[],
    quoteAsset: string,
    baseAsset: string,
    lastTradeId: number,
  ) {
    this.bids = bids;
    this.asks = asks;
    this.quoteAsset = quoteAsset;
    this.baseAsset = baseAsset;
    this.lastTradeId = lastTradeId || 0;
    this.deletedAskPrices = new Set<number>();
    this.deletedBidPrices = new Set<number>();
  }

  ticker() {
    return `${this.baseAsset}_${this.quoteAsset}`;
  }

  addOrder(order: Order) {
    if (order.side == "buy") {
      const { executedQty, fills } = this.matchBid(order);
      order.filled = executedQty;

      const deletedAsks = new Set(this.deletedAskPrices);
      const deletedBids = new Set(this.deletedBidPrices);

      this.deletedAskPrices.clear();
      this.deletedBidPrices.clear();

      if (order.quantity == executedQty) {
        return {
          executedQty,
          fills,
          deletedBids,
          deletedAsks,
        };
      }

      this.bids.push(order);

      return {
        executedQty,
        fills,
        deletedBids,
        deletedAsks,
      };
    } else {
      const { executedQty, fills } = this.matchAsk(order);
      order.filled = executedQty;
      const deletedAsks = new Set(this.deletedAskPrices);
      const deletedBids = new Set(this.deletedBidPrices);

      this.deletedAskPrices.clear();
      this.deletedBidPrices.clear();

      if (order.quantity == executedQty) {
        return {
          executedQty,
          fills,
          deletedBids,
          deletedAsks,
        };
      }

      this.asks.push(order);
      return {
        executedQty,
        fills,
        deletedBids,
        deletedAsks,
      };
    }
  }

  private matchAsk(order: Order): {
    executedQty: number;
    fills: Fill[];
  } {
    const sortedBids = this.bids.sort((a, b) => {
      if (a.price !== b.price) {
        return b.price - a.price;
      }
      return b.timestamp - a.timestamp;
    });

    let executedQty = 0;
    let fills: Fill[] = [];

    let filledCounter = -1;

    for (let i = 0; i < sortedBids.length; ++i) {
      if (order.price >= sortedBids[i]!.price && executedQty < order.quantity) {
        const filledQty = Math.min(
          sortedBids[i]!.quantity - sortedBids[i]!.filled,
          order.quantity - executedQty,
        );
        sortedBids[i]!.filled += filledQty;
        executedQty += filledQty;

        if (sortedBids[i]!.quantity == sortedBids[i]!.filled) {
          this.deletedBidPrices.add(sortedBids[i]!.price);
          filledCounter = i;
        }

        fills.push({
          price: sortedBids[i]!.price,
          quantity: filledQty,
          makerOrderId: sortedBids[i]!.orderId,
          otherUserId: sortedBids[i]!.userId,
          tradeId: this.lastTradeId++,
        });
      }
    }

    if (filledCounter != -1) {
      sortedBids.splice(0, filledCounter + 1);
    }

    return {
      executedQty,
      fills,
    };
  }

  private matchBid(order: Order): {
    executedQty: number;
    fills: Fill[];
  } {
    // first of all the asks should be sorted
    const sortedAsks = this.asks.sort((a, b) => {
      if (a.price !== b.price) {
        return a.price - b.price;
      }
      return a.timestamp - b.timestamp;
    });

    let executedQty = 0;
    let fills: Fill[] = [];
    let filledCounter = -1;

    for (let i = 0; i < sortedAsks.length; ++i) {
      if (sortedAsks[i]!.price <= order.price && executedQty < order.quantity) {
        const filledQty = Math.min(
          sortedAsks[i]!.quantity - sortedAsks[i]!.filled,
          order.quantity - executedQty,
        );
        executedQty += filledQty;
        sortedAsks[i]!.filled += filledQty;

        if (sortedAsks[i]!.filled == sortedAsks[i]!.quantity) {
          this.deletedAskPrices.add(sortedAsks[i]!.price);
          filledCounter = i;
        }

        fills.push({
          price: sortedAsks[i]!.price,
          quantity: filledQty,
          makerOrderId: sortedAsks[i]!.orderId,
          otherUserId: sortedAsks[i]!.userId,
          tradeId: this.lastTradeId++,
        });
      }
    }

    if (filledCounter != -1) {
      sortedAsks.splice(0, filledCounter + 1);
    }

    return { executedQty, fills };
  }

  getOpenOrders(userId: string) {
    const asks = this.asks.filter((ask) => ask.userId == userId);
    const bids = this.bids.filter((bid) => bid.userId == userId);

    return [...asks, ...bids];
  }

  getDepth() {
    const aggregatedBids: [number, number][] = Object.values(
      this.bids.reduce<Record<number, Order>>((acc, order) => {
        if (acc[order.price]) {
          acc[order.price]!.quantity += order.quantity;
        } else {
          acc[order.price] = { ...order };
        }
        return acc;
      }, {}),
    ).map(({ price, quantity }) => [price, quantity]);

    const aggregatedAsks: [number, number][] = Object.values(
      this.asks.reduce<Record<number, Order>>((acc, order) => {
        if (acc[order.price]) {
          acc[order.price]!.quantity += order.quantity;
        } else {
          acc[order.price] = { ...order };
        }
        return acc;
      }, {}),
    ).map(({ price, quantity }) => [price, quantity]);

    return {
      bids: aggregatedBids,
      asks: aggregatedAsks,
    };
  }
}

export interface Order {
  price: number;
  quantity: number;
  filled: number;
  side: "buy" | "sell";
  userId: string;
  orderId: string;
  timestamp: number;
  market: string;
  type: "market" | "limit";
}

export interface Fill {
  price: number;
  quantity: number;
  tradeId: number;
  otherUserId: string;
  makerOrderId: string;
}

export interface Ticker {
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
}

export class Orderbook {
  bids: Order[];
  asks: Order[];
  quoteAsset: string;
  baseAsset: string;
  lastTradeId: number;

  deletedBidPrices: Set<number>;
  deletedAskPrices: Set<number>;

  private tickerData: Ticker;
  private tickerWindowStart: number;

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

    this.tickerData = {
      symbol: `${baseAsset}_${quoteAsset}`,
      firstPrice: "0",
      lastPrice: "0",
      low: "Infinity",
      high: "0",
      priceChange: "0",
      priceChangePercent: "0",
      quoteVolume: "0",
      trades: "0",
      volume: "0",
      updateTimestamp: Date.now(),
    };

    this.tickerWindowStart = Date.now();
  }

  ticker() {
    return `${this.baseAsset}_${this.quoteAsset}`;
  }

  private updateTicker(fills: Fill[]) {
    if (fills.length == 0) return;

    if (Date.now() - this.tickerWindowStart > 24 * 60 * 60 * 1000) {
      this.tickerData.firstPrice = this.tickerData.lastPrice;
      this.tickerData.high = this.tickerData.lastPrice;
      this.tickerData.low = this.tickerData.lastPrice;
      this.tickerData.volume = "0";
      this.tickerData.quoteVolume = "0";
      this.tickerData.trades = "0";
      this.tickerWindowStart = Date.now();
    }

    for (const fill of fills) {
      const price = fill.price;
      const qty = fill.quantity;

      if (this.tickerData.firstPrice == "0") {
        this.tickerData.firstPrice = price.toString();
        this.tickerData.low = price.toString();
        this.tickerData.high = price.toString();
      }

      this.tickerData.lastPrice = price.toString();
      this.tickerData.low = String(
        Math.min(Number(this.tickerData.low), price),
      );
      this.tickerData.high = String(
        Math.max(Number(this.tickerData.high), price),
      );

      this.tickerData.volume = String(
        Number(this.tickerData.volume) + Number(qty),
      );

      this.tickerData.quoteVolume = String(
        Number(this.tickerData.quoteVolume) + Number(price) * Number(qty),
      );
      this.tickerData.trades = String(Number(this.tickerData.trades) + 1);
    }

    const priceChange =
      Number(this.tickerData.lastPrice) - Number(this.tickerData.firstPrice);
    this.tickerData.priceChange = String(priceChange);
    this.tickerData.priceChangePercent =
      Number(this.tickerData.firstPrice) === 0
        ? "0"
        : String((priceChange / Number(this.tickerData.firstPrice)) * 100);
    this.tickerData.updateTimestamp = Date.now();
  }

  getTicker() {
    return { ...this.tickerData };
  }

  addOrder(order: Order) {
    if (order.side == "buy") {
      const { executedQty, fills } = this.matchBid(order);
      order.filled = executedQty;

      console.log("matching the bid : ", this.asks);

      const deletedAsks = new Set(this.deletedAskPrices);
      const deletedBids = new Set(this.deletedBidPrices);

      this.deletedAskPrices.clear();
      this.deletedBidPrices.clear();

      this.updateTicker(fills);

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

      console.log("matching the ask : ", this.bids);

      const deletedAsks = new Set(this.deletedAskPrices);
      const deletedBids = new Set(this.deletedBidPrices);

      this.deletedAskPrices.clear();
      this.deletedBidPrices.clear();

      this.updateTicker(fills);

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

    console.log("sorted bids matching ask : ", sortedBids);

    let executedQty = 0;
    let fills: Fill[] = [];

    let filledCounter = -1;

    for (let i = 0; i < sortedBids.length; ++i) {
      if (order.price <= sortedBids[i]!.price && executedQty < order.quantity) {
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
    console.log("bids : ", this.bids);
    console.log("asks : ", this.asks);

    const aggregatedBids: [number, number][] = Object.values(
      this.bids.reduce<Record<number, Order>>((acc, order) => {
        const remaining = order.quantity - order.filled;
        if (acc[order.price]) {
          acc[order.price]!.quantity += remaining;
        } else {
          acc[order.price] = { ...order, quantity: remaining };
        }
        return acc;
      }, {}),
    ).map(({ price, quantity }) => [price, quantity]);

    const aggregatedAsks: [number, number][] = Object.values(
      this.asks.reduce<Record<number, Order>>((acc, order) => {
        const remaining = order.quantity - order.filled;

        if (acc[order.price]) {
          acc[order.price]!.quantity += remaining;
        } else {
          acc[order.price] = { ...order, quantity: remaining };
        }
        return acc;
      }, {}),
    ).map(({ price, quantity }) => [price, quantity]);

    console.log("bids aggregated : ", aggregatedBids);
    console.log("asks agg: ", aggregatedAsks);

    return {
      bids: aggregatedBids,
      asks: aggregatedAsks,
    };
  }
}

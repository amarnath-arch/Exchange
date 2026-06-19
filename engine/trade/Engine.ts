import RedisManager from "../RedisManager";
import {
  CANCEL_ORDER,
  CREATE_ORDER,
  GET_DEPTH,
  GET_OPEN_ORDERS,
  GET_TICKER,
  ON_RAMP,
  type MessageFromApi,
} from "../types/from";
import { ORDER_UPDATE } from "../types/to";
import { Orderbook, type Fill, type Order, type Ticker } from "./Orderbook";
import { v4 as uuid } from "uuid";

interface UserBalance {
  [key: string]: {
    available: number;
    locked: number;
  };
}

export default class Engine {
  // will have orderbooks
  private orderbooks: Orderbook[] = [];
  // uyserbalance
  private balances: Map<string, UserBalance>;

  private currentCandles: Map<
    string,
    {
      open: number;
      high: number;
      low: number;
      close: number;
      start: number;
      end: number;
    }
  > = new Map();

  constructor() {
    this.balances = new Map<string, UserBalance>();
    this.orderbooks = [new Orderbook([], [], "USDC", "SOL", 0)];
  }

  async process({
    message,
    clientId,
  }: {
    message: MessageFromApi;
    clientId: string;
  }) {
    console.log("message received");
    switch (message.type) {
      case CREATE_ORDER:
        try {
          const { executedQty, fills, orderId } = this.createOrder(
            message.data.market,
            message.data.price,
            message.data.quantity,
            message.data.userId,
            message.data.side,
          );

          let sendingFills = fills.map((fill) => {
            return {
              price: fill.price.toString(),
              quantity: fill.quantity,
              tradeId: fill.tradeId,
            };
          });

          await RedisManager.getInstance().sendToApi(clientId, {
            type: "ORDER_PLACED",
            payload: {
              executedQty,
              fills: sendingFills,
              orderId,
            },
          });
        } catch (e) {
          console.log(e);

          RedisManager.getInstance().sendToApi(clientId, {
            type: "ORDER_CANCELLED",
            payload: {
              executedQty: 0,
              remainingQty: 0,
              orderId: "",
            },
          });
        }
        break;

      case CANCEL_ORDER:
        break;

      case GET_OPEN_ORDERS:
        try {
          // find the orderbook
          const openOrderbook = this.orderbooks.find(
            (o) => o.ticker() == message.data.market,
          );

          if (!openOrderbook) {
            throw new Error("No orderbook found");
          }

          const openOrders = openOrderbook.getOpenOrders(message.data.userId);
          console.log("open Orders: ", openOrders);

          RedisManager.getInstance().sendToApi(clientId, {
            type: "OPEN_ORDERS",
            payload: openOrders,
          });
        } catch (e) {
          console.log(e);
        }
        break;
      case ON_RAMP:
        const userId = message.data.userId;
        const amount = Number(message.data.amount);
        console.log("onRamping");
        this.onRamp(userId, amount, message.data.asset);
        console.log("amountUpdated");
        RedisManager.getInstance().sendToApi(clientId, {
          type: "ON_RAMP",
          payload: {
            amount: amount,
            userId: userId,
            asset: message.data.asset,
          },
        });
        break;
      case GET_DEPTH:
        try {
          const market = message.data.market;
          const orderbook = this.orderbooks.find((o) => o.ticker() === market);
          if (!orderbook) {
            throw new Error("No orderbook found");
          }
          RedisManager.getInstance().sendToApi(clientId, {
            type: "DEPTH",
            payload: orderbook.getDepth(),
          });
        } catch (e) {
          console.log(e);
          RedisManager.getInstance().sendToApi(clientId, {
            type: "DEPTH",
            payload: {
              bids: [],
              asks: [],
            },
          });
        }
        break;
      case GET_TICKER:
        try {
          const market = message.data.market;
          const orderbook = this.orderbooks.find((o) => o.ticker() === market);
          if (!orderbook) {
            throw new Error("No orderbook found");
          }
          RedisManager.getInstance().sendToApi(clientId, {
            type: "TICKER",
            payload: orderbook.getTicker(),
          });
        } catch (e) {
          console.log(e);
          RedisManager.getInstance().sendToApi(clientId, {
            type: "TICKER",
            payload: {
              firstPrice: "",
              high: "",
              lastPrice: "",
              low: "",
              priceChange: "",
              priceChangePercent: "",
              quoteVolume: "",
              symbol: "",
              trades: "",
              volume: "",
              updateTimestamp: 0,
            },
          });
        }
        break;
    }
  }

  private createOrder(
    market: string,
    price: string,
    quantity: string,
    userId: string,
    side: "buy" | "sell",
  ) {
    const orderbook = this.orderbooks.find((o) => o.ticker() == market);
    if (!orderbook) {
      throw new Error("No Orderbook found for this market");
    }

    const baseAsset = market.split("_")[0];
    const quoteAsset = market.split("_")[1];

    // update the available and locked funds
    this.checkAndLockFunds(
      side,
      quoteAsset!,
      baseAsset!,
      userId,
      Number(quantity),
      Number(price),
    );

    // create the order
    const order: Order = {
      price: Number(price),
      quantity: Number(quantity),
      side: side,
      filled: 0,
      userId: userId,
      orderId: uuid(),
      timestamp: Date.now(),
    };

    // getting the depth before order update
    // const beforeUpdateDepth = orderbook.getDepth();

    // match the order
    const { executedQty, fills, deletedAsks, deletedBids } =
      orderbook.addOrder(order);

    this.updateBalance(userId, side, fills, quoteAsset!, baseAsset!); // updated the balance
    // now I have to put in a queue for db to pull the things and publish the things for the socket
    this.createDbTrades(fills, market, userId, order.orderId);
    this.updateDbOrders(order, executedQty, fills, market);
    this.publisWsDepthUpdates(
      fills,
      price,
      side,
      market,
      deletedBids,
      deletedAsks,
    );

    this.publishWsTrades(fills, userId, market);

    this.publishWsTickerUpdates(orderbook.getTicker(), market);

    this.publishWsKlineUpdates(fills, market);

    const orderId = order.orderId;

    return { executedQty, fills, orderId };
  }

  private updateBalance(
    userId: string,
    side: "buy" | "sell",
    fills: Fill[],
    quoteAsset: string,
    baseAsset: string,
  ) {
    const userBalance = this.balances.get(userId);
    if (!userBalance) {
      throw new Error("User Balance not found ");
    }
    if (side == "buy") {
      // order was buy order so someone was selling and I have the decrease the base asset of the other user
      fills.forEach((fill) => {
        const otherUserId = this.balances.get(fill.otherUserId);
        if (!otherUserId) {
          throw new Error("Other userId Balance not found");
        }

        if (
          !otherUserId[baseAsset] ||
          !otherUserId[quoteAsset] ||
          !userBalance[quoteAsset] ||
          !userBalance[baseAsset]
        ) {
          throw new Error("No base Asset in other user id");
        }

        otherUserId[baseAsset].locked -= fill.quantity;
        otherUserId[quoteAsset].available += fill.quantity * fill.price;

        userBalance[quoteAsset].locked -= fill.quantity * fill.price;
        userBalance[baseAsset].available += fill.quantity;
      });
    } else {
      // order was sell order so there are buy orders in the market which I am going to consume
      fills.forEach((fill) => {
        const otherUserId = this.balances.get(fill.otherUserId);
        if (!otherUserId) {
          throw new Error("Other userId Balance not found");
        }

        if (
          !otherUserId[baseAsset] ||
          !otherUserId[quoteAsset] ||
          !userBalance[quoteAsset] ||
          !userBalance[baseAsset]
        ) {
          throw new Error("No base Asset in other user id");
        }

        otherUserId[baseAsset].available += fill.quantity;
        otherUserId[quoteAsset].locked -= fill.quantity * fill.price;

        userBalance[quoteAsset].available += fill.quantity * fill.price;
        userBalance[baseAsset].locked -= fill.quantity;
      });
    }
  }

  private checkAndLockFunds(
    side: "buy" | "sell",
    quoteAsset: string,
    baseAsset: string,
    userId: string,
    quantity: number,
    price: number,
  ) {
    const userBalance = this.balances.get(userId);

    if (!userBalance) {
      throw new Error("User balances not found");
    }

    const total = quantity * price;

    if (side == "buy") {
      if ((userBalance[quoteAsset]?.available ?? 0) < total) {
        throw new Error("Insufficient funds");
      }

      if (!userBalance[quoteAsset]) {
        throw new Error(`No balance found for asset: ${quoteAsset}`);
      }

      userBalance[quoteAsset].available -= total;
      userBalance[quoteAsset].locked += total;
    } else {
      if ((userBalance[baseAsset]?.available ?? 0) < quantity) {
        throw new Error("Insufficient funds");
      }

      if (!userBalance[baseAsset]) {
        throw new Error(`No balance found for asset: ${quoteAsset}`);
      }
      console.log(
        "updating before : available : ",
        userBalance[baseAsset].available,
      );
      console.log("updating before : locked : ", userBalance[baseAsset].locked);

      userBalance[baseAsset].available -= quantity;
      userBalance[baseAsset].locked += quantity;

      console.log(
        "updating balance : available : ",
        userBalance[baseAsset].available,
      );
      console.log(
        "updating balance : locked : ",
        userBalance[baseAsset].locked,
      );
    }
  }

  private onRamp(userId: string, amount: number, asset: string) {
    const userBalance = this.balances.get(userId);
    if (!userBalance) {
      this.balances.set(userId, {
        [asset]: {
          available: amount,
          locked: 0,
        },
      });
    } else {
      if (!userBalance[asset]) {
        userBalance[asset] = { available: amount, locked: 0 };
      } else {
        userBalance[asset].available += amount;
      }
    }
  }

  private updateDbOrders(
    order: Order,
    executedQty: number,
    fills: Fill[],
    market: string,
  ) {
    console.log("pushing to the db update db orders");
    RedisManager.getInstance().pushMessage({
      type: ORDER_UPDATE,
      data: {
        orderId: order.orderId,
        userId: order.userId,
        executedQty: executedQty,
        market: market,
        price: order.price.toString(),
        quantity: order.quantity.toString(),
        side: order.side,
        timestamp: Date.now(),
      },
    });

    fills.forEach((fill) => {
      RedisManager.getInstance().pushMessage({
        type: ORDER_UPDATE,
        data: {
          orderId: fill.makerOrderId,
          executedQty: fill.quantity,
        },
      });
    });
  }

  private createDbTrades(
    fills: Fill[],
    market: string,
    userId: string,
    orderId: string,
  ) {
    // NEED to make the changes  accordingly TODO://

    fills.forEach((fill) => {
      RedisManager.getInstance().pushMessage({
        type: "TRADE_ADDED",
        data: {
          market: market,
          id: fill.tradeId.toString(),
          isBuyerMaker: fill.otherUserId == userId,
          makerOrderId: fill.makerOrderId,
          takerOrderId: orderId,
          price: fill.price.toString(),
          quantity: fill.quantity.toString(),
          quoteQuantity: (fill.quantity * fill.price).toString(),
          timestamp: Date.now(),
        },
      });
    });
  }

  // private publishWsUpdates(
  //   beforeUpdateDepth: {
  //     asks: [number, number][];
  //     bids: [number, number][];
  //   },
  //   afterUpdateDepth: {
  //     asks: [number, number][];
  //     bids: [number, number][];
  //   },
  //   market: string,
  // ) {
  //   const beforeDepth = this.convertOrderBook(beforeUpdateDepth);
  //   const afterDepth = this.convertOrderBook(afterUpdateDepth);

  //   const updatedBids: [string, string][] = [];
  //   const updatedAsks: [string, string][] = [];
  //   for (const [price, qty] of afterDepth.bids) {
  //     const beforeQty = beforeDepth.bids.get(price);
  //     if (!beforeQty || qty != beforeQty) {
  //       updatedBids.push([price.toString(), qty.toString()]);
  //     }
  //   }

  //   for (const [price, qty] of afterDepth.asks) {
  //     if (qty != beforeDepth.asks.get(price)) {
  //       updatedAsks.push([price.toString(), qty.toString()]);
  //     }
  //   }

  //   RedisManager.getInstance().publishMessage(`Depth@${market}`, {
  //     stream: `depth@${market}`,
  //     data: {
  //       e: "depth",
  //       s: market,
  //       a: updatedAsks,
  //       b: updatedBids,
  //     },
  //   });
  // }

  // convertOrderBook(raw: {
  //   bids: [number, number][];
  //   asks: [number, number][];
  // }) {
  //   return {
  //     bids: new Map<number, number>(raw.bids),
  //     asks: new Map<number, number>(raw.asks),
  //   };
  // }

  private publishWsTrades(fills: Fill[], userId: string, market: string) {
    fills.forEach((fill) => {
      RedisManager.getInstance().publishMessage(`trade@${market}`, {
        stream: `trade@${market}`,
        data: {
          e: "trade",
          t: fill.tradeId,
          m: fill.otherUserId === userId, // TODO: Is this right?
          p: fill.price.toString(),
          q: fill.quantity.toString(),
          s: market,
        },
      });
    });
  }

  //// pub sub

  private publishWsTickerUpdates(tickerData: Ticker, market: string) {
    RedisManager.getInstance().publishMessage(`ticker@${market}`, {
      stream: `ticker@${market}`,
      data: {
        c: tickerData.lastPrice,
        h: tickerData.high,
        l: tickerData.low,
        v: tickerData.volume,
        V: tickerData.quoteVolume,
        s: market,
        id: tickerData.updateTimestamp,
        e: "ticker",
      },
    });
  }

  private publishWsKlineUpdates(fills: Fill[], market: string) {
    if (fills.length === 0) return;

    fills.forEach((fill) => {
      const now = Date.now();
      const intervalMs = 60 * 1000;
      const start = Math.floor(now / intervalMs) * intervalMs;
      const end = start + intervalMs;

      const existing = this.currentCandles.get(market);
      let isNewCandle = false;
      let candle: {
        open: number;
        high: number;
        low: number;
        close: number;
        start: number;
        end: number;
      };

      if (!existing || existing.start !== start) {
        candle = {
          open: fill.price,
          high: fill.price,
          low: fill.price,
          close: fill.price,
          start,
          end,
        };
        isNewCandle = true;
      } else {
        candle = {
          ...existing,
          high: Math.max(existing.high, fill.price),
          low: Math.min(existing.low, fill.price),
          close: fill.price,
        };
      }

      this.currentCandles.set(market, candle);

      RedisManager.getInstance().pushMessage({
        type: "KLINE_UPDATE",
        data: {
          market,
          price: fill.price.toString(),
          quantity: fill.quantity.toString(),
          quoteQuantity: (fill.price * fill.quantity).toString(),
          start: start.toString(),
          end: end.toString(),
          timestamp: now,
        },
      });

      // also publish to WebSocket for the live forming candle
      RedisManager.getInstance().publishMessage(`kline@${market}`, {
        stream: `kline@${market}`,
        data: {
          e: "kline",
          s: market,
          o: candle.open.toString(),
          h: candle.high.toString(),
          l: candle.low.toString(),
          c: candle.close.toString(),
          start: start.toString(),
          end: end.toString(),
          newCandleInitiated: isNewCandle,
        },
      });
    });
  }

  private publisWsDepthUpdates(
    fills: Fill[],
    price: string,
    side: "buy" | "sell",
    market: string,
    deletedBids: Set<number>,
    deletedAsks: Set<number>,
  ) {
    const orderbook = this.orderbooks.find((o) => o.ticker() === market);
    if (!orderbook) {
      return;
    }
    const depth = orderbook.getDepth();
    if (side === "buy") {
      let updatedAsks = depth?.asks.filter((x) => {
        return fills.map((f) => f.price).includes(x[0]);
      });

      [...deletedAsks.entries()].forEach(([askPrice]) => {
        const includes = updatedAsks.map((x) => x[0]).includes(askPrice);
        if (!includes) {
          updatedAsks.push([askPrice, 0]);
        }
      });

      const updatedBid = depth?.bids.find((x) => x[0].toString() === price);
      console.log("publish ws depth updates");
      RedisManager.getInstance().publishMessage(`depth@${market}`, {
        stream: `depth@${market}`,
        data: {
          a: updatedAsks.map((asks) => [
            asks[0].toString(),
            asks[1].toString(),
          ]),
          b: updatedBid
            ? [updatedBid].map((bid) => [bid[0].toString(), bid[1].toString()])
            : [],
          e: "depth",
          s: market,
        },
      });
    }
    if (side === "sell") {
      const updatedBids = depth?.bids.filter((x) =>
        fills.map((f) => f.price).includes(x[0]),
      );

      [...deletedBids.entries()].forEach(([bidPrice]) => {
        const includes = updatedBids.map((x) => x[0]).includes(bidPrice);
        if (!includes) {
          updatedBids.push([bidPrice, 0]);
        }
      });

      const updatedAsk = depth?.asks.find((x) => x[0].toString() === price);
      console.log("publish ws depth updates");
      RedisManager.getInstance().publishMessage(`depth@${market}`, {
        stream: `depth@${market}`,
        data: {
          a: updatedAsk
            ? [updatedAsk].map((ask) => [ask[0].toString(), ask[1].toString()])
            : [],
          b: updatedBids.map((bids) => [
            bids[0].toString(),
            bids[1].toString(),
          ]),
          e: "depth",
          s: market,
        },
      });
    }
  }
}

import RedisManager from "../RedisManager";
import {
  CANCEL_ORDER,
  CREATE_ORDER,
  GET_DEPTH,
  GET_OPEN_ORDERS,
  ON_RAMP,
  type MessageFromApi,
} from "../types/from";
import { ORDER_UPDATE } from "../types/to";
import { Orderbook, type Fill, type Order } from "./Orderbook";
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

  constructor() {
    this.balances = new Map<string, UserBalance>();
  }

  async process({
    message,
    clientId,
  }: {
    message: MessageFromApi;
    clientId: string;
  }) {
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
        this.onRamp(userId, amount, message.data.asset);
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
      if ((userBalance[baseAsset]?.available ?? 0) < total) {
        throw new Error("Insufficient funds");
      }

      if (!userBalance[baseAsset]) {
        throw new Error(`No balance found for asset: ${quoteAsset}`);
      }
      userBalance[baseAsset].available -= quantity * price;
      userBalance[baseAsset].locked += quantity * price;
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
        },
      });
    }
  }
}

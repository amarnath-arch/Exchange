import RedisManager from "../RedisManager";
import {
  CANCEL_ORDER,
  CREATE_ORDER,
  GET_DEPTH,
  GET_OPEN_ORDERS,
  ON_RAMP,
  type MessageFromApi,
} from "../types/from";
import { Orderbook, type Order } from "./Orderbook";
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
    const { executedQty, fills } = orderbook.addOrder(order);

    const orderId = order.orderId;

    return { executedQty, fills, orderId };
  }

  checkAndLockFunds(
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

  onRamp(userId: string, amount: number, asset: string) {
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
}

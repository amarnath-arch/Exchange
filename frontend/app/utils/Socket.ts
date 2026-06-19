import { Ticker } from "./types";

// export const BASE_SOCKET_URL = "wss://ws.backpack.exchange/";
export const BASE_SOCKET_URL = "ws://localhost:8080/";

interface Callback {
  comp: string;
  callback: any;
}

export default class SocketManager {
  private static instance: SocketManager;
  private socket: WebSocket;
  private bufferedMessages: any[] = [];
  private id: number;
  private initialized: boolean = false;
  private callbacks: Map<string, Map<string, Callback[]>>;

  private constructor() {
    this.socket = new WebSocket(BASE_SOCKET_URL);
    this.bufferedMessages = [];
    this.id = 1;
    this.callbacks = new Map<string, Map<string, Callback[]>>();
    this.init();
  }

  public static getInstance() {
    if (!this.instance) {
      this.instance = new SocketManager();
    }
    return this.instance;
  }

  private init() {
    this.socket.onopen = () => {
      this.initialized = true;
      this.bufferedMessages.forEach((message) => {
        this.socket.send(JSON.stringify(message));
      });
      this.bufferedMessages = [];
    };

    this.socket.onmessage = (event) => {
      const message = JSON.parse(event.data); // message from this socket

      const type = message.data.e;
      const id = message.data.s;

      if (this.callbacks.has(type) && this.callbacks.get(type)?.has(id)) {
        const callbackArr = this.callbacks.get(type)?.get(id);

        if (!callbackArr) {
          return;
        }

        if (type == "ticker") {
          const newTicker: Partial<Ticker> = {
            lastPrice: message.data.c,
            high: message.data.h,
            low: message.data.l,
            volume: message.data.v,
            quoteVolume: message.data.V,
            symbol: message.data.s,
          };

          console.log("new tikcer is : ", message.data);
          console.log("callbackArr is : ", callbackArr);

          for (const cb of callbackArr) {
            cb.callback(newTicker);
          }
          // callback(newTicker);
        } else if (type == "depth") {
          const updatedBids = message.data.b;
          const updatedAsks = message.data.a;
          console.log("updated bids ", updatedAsks);
          console.log("updated asks", updatedBids);
          console.log("callbackARr for depth: ", callbackArr);
          for (const cb of callbackArr) {
            cb.callback({ bids: updatedBids, asks: updatedAsks });
          }
          // callback({ bids: updatedBids, asks: updatedAsks });
        } else if (type == "kline") {
          for (const cb of callbackArr) {
            cb.callback(message.data);
          }
        }
      }
    };
  }

  sendMessage(message: any) {
    if (!this.initialized) {
      //   alert("socket not initialized");
      this.bufferedMessages.push({ ...message, id: this.id++ });
      return;
    }

    this.socket.send(JSON.stringify({ ...message, id: this.id++ }));
  }

  async registerCallback(
    type: string,
    callback: any,
    id: string,
    component: string,
  ) {
    if (!this.callbacks.has(type)) {
      this.callbacks.set(type, new Map<string, Callback[]>());
    }

    const callbacks = this.callbacks.get(type);

    if (!callbacks?.has(id)) {
      callbacks?.set(id, []);
    }

    const callbacksArr = callbacks?.get(id);

    callbacksArr?.push({
      comp: component,
      callback: callback,
    });
  }

  async deregisterCallback(type: string, id: string, component: string) {
    if (!this.callbacks.has(type) || !this.callbacks.get(type)?.has(id)) {
      return;
    }

    if (this.callbacks.get(type)?.get(id)?.length == 0) {
      return;
    }

    const callbackArr = this.callbacks.get(type)?.get(id);

    if (!callbackArr) {
      return;
    }

    for (let i = 0; i < callbackArr.length; ++i) {
      if (callbackArr[i].comp == component) {
        callbackArr.splice(i, 1);
      }
    }

    if (callbackArr.length == 0) {
      this.callbacks.get(type)?.delete(id);
    }

    if (this.callbacks.get(type)?.size === 0) {
      this.callbacks.delete(type);
    }
  }
}

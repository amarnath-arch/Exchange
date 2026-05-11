import { Ticker } from "./types";

export const BASE_SOCKET_URL = "wss://ws.backpack.exchange/";

export default class SocketManager {
  private static instance: SocketManager;
  private socket: WebSocket;
  private bufferedMessages: any[] = [];
  private id: number;
  private initialized: boolean = false;
  private callbacks: Map<string, Map<string, any>>;

  private constructor() {
    this.socket = new WebSocket(BASE_SOCKET_URL);
    this.bufferedMessages = [];
    this.id = 1;
    this.callbacks = new Map<string, Map<string, any>>();
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

      if (this.callbacks.get(type) && this.callbacks.get(type)?.get(id)) {
        const callback = this.callbacks.get(type)?.get(id);

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

          callback(newTicker);
        } else if (type == "depth") {
          const updatedBids = message.data.b;
          const updatedAsks = message.data.a;
          callback({ bids: updatedBids, asks: updatedAsks });
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

  async registerCallback(type: string, callback: any, id: string) {
    if (!this.callbacks.has(type)) {
      this.callbacks.set(type, new Map<string, any>());
    }

    this.callbacks.get(type)?.set(id, callback);
  }

  async deregisterCallback(type: string, id: string) {
    if (!this.callbacks.has(type) || !this.callbacks.get(type)?.has(id)) {
      return;
    }

    this.callbacks.get(type)?.delete(id);

    if (this.callbacks.get(type)?.size === 0) {
      this.callbacks.delete(type);
    }
  }
}

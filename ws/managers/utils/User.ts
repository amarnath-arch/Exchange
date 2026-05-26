import type WebSocket from "ws";
import type { IncomingMessage } from "../../types.ts/incoming";
import type { OutgoingMessage } from "../../types.ts/outgoing";
import { SubscriptionManager } from "../SubscriptionManager";

export class User {
  // add corresponding to the socket identifies as a user
  private id: string;
  private socket: WebSocket;

  constructor(id: string, socket: WebSocket) {
    this.id = id;
    this.socket = socket;
    this.initHandler();
  }

  private initHandler() {
    this.socket.on("message", (message: string) => {
      const parsedMessage: IncomingMessage = JSON.parse(message);

      if (parsedMessage.method == "SUBSCRIBE") {
        parsedMessage.params.forEach((subscription) =>
          SubscriptionManager.getInstance().subscribe(this.id, subscription),
        );
      } else {
        parsedMessage.params.forEach((subscription) =>
          SubscriptionManager.getInstance().unsubscribe(this.id, subscription),
        );
      }
    });
  }

  public sendMessage(message: OutgoingMessage) {
    this.socket.send(JSON.stringify(message));
  }
}

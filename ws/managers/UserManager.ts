import type WebSocket from "ws";
import { v4 as uuid } from "uuid";
import { User } from "./utils/User";
import { SubscriptionManager } from "./SubscriptionManager";

export class UserManager {
  private static instance: UserManager;
  private users: Map<string, User> = new Map<string, User>();

  private constructor() {}

  public static getInstance() {
    if (!this.instance) {
      this.instance = new UserManager();
    }
    return this.instance;
  }

  public addUser(ws: WebSocket) {
    const userId = uuid();
    const user = new User(userId, ws);
    this.socketClose(ws, userId);
  }

  private socketClose(ws: WebSocket, userId: string) {
    ws.on("close", () => {
      this.users.delete(userId);
      SubscriptionManager.getInstance().userLeft(userId);
    });
  }

  public getUser(userId: string) {
    return this.users.get(userId);
  }
}

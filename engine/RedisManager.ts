import type { RedisClientType } from "@redis/client";
import { createClient } from "redis";
import type { DbMessage, MessageToApi } from "./types/to";
import type { WsMessage } from "./types/toWs";

export default class RedisManager {
  private static instance: RedisManager;
  private client: RedisClientType;

  private constructor() {
    this.client = createClient();
    this.client.connect();
  }

  public static getInstance() {
    if (!this.instance) {
      this.instance = new RedisManager();
    }
    return this.instance;
  }

  async sendToApi(clientId: string, message: MessageToApi) {
    await this.client.publish(clientId, JSON.stringify(message));
  }

  async pushMessage(message: DbMessage) {
    console.log("pushing the order update message");
    console.log(message);
    await this.client.lPush("db_processor", JSON.stringify(message));
  }

  async publishMessage(channel: string, message: WsMessage) {
    await this.client.publish(channel, JSON.stringify(message));
  }
}

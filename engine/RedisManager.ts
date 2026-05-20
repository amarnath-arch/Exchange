import type { RedisClientType } from "@redis/client";
import { createClient } from "redis";
import type { MessageToApi } from "./types/to";

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
}

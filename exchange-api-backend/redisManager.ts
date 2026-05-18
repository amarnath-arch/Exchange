import { RedisClient } from "bun";
import { createClient, type RedisClientType } from "redis";
import { v4 as uuid } from "uuid";
import type { MessageToEngine } from "./types/types";

export default class RedisManager {
  private static instance: RedisManager;
  private client: RedisClientType;
  private publisher: RedisClientType;

  private constructor() {
    this.client = createClient();
    this.client.connect();
    this.publisher = createClient();
    this.publisher.connect();
  }

  public static getInstance() {
    if (!this.instance) {
      this.instance = new RedisManager();
    }

    return this.instance;
  }

  public async sendAndAwait(message: MessageToEngine) {
    const id = uuid();

    // listen from teh publisher TODO://

    this.client.lPush(
      "messages",
      JSON.stringify({
        clientId: id,
        message,
      }),
    );
  }
}

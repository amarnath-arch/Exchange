import type { RedisClientType } from "@redis/client";
import type { RedisClient } from "bun";
import { createClient } from "redis";
import { UserManager } from "./UserManager";

export class SubscriptionManager {
  //
  private static instance: SubscriptionManager;
  private userIdtoSubscription: Map<string, Set<string>> = new Map<
    string,
    Set<string>
  >();

  private subscriptionToUser: Map<string, Set<string>> = new Map<
    string,
    Set<string>
  >();

  private client: RedisClientType;

  private constructor() {
    this.client = createClient();
    this.client.connect();
  }

  public static getInstance() {
    if (!this.instance) {
      this.instance = new SubscriptionManager();
    }
    return this.instance;
  }

  subscribe(userId: string, subscription: string) {
    // user already a part of the subscription
    if (!this.userIdtoSubscription.get(userId)) {
      this.userIdtoSubscription.set(userId, new Set<string>());
    }

    if (!this.subscriptionToUser.get(subscription)) {
      this.subscriptionToUser.set(subscription, new Set<string>());
    }

    if (this.userIdtoSubscription.get(userId)?.has(subscription)) {
      return;
    }

    const userIdToSubSet = this.userIdtoSubscription.get(userId);
    userIdToSubSet?.add(subscription);

    const subToUserIdSet = this.subscriptionToUser.get(subscription);
    subToUserIdSet?.add(userId);

    if (this.subscriptionToUser.get(subscription)?.size == 1) {
      this.client.subscribe(subscription, (message: any) => {
        const parsedMessage = JSON.parse(message);
        // console.log("message received : ", parsedMessage);
        // console.log("message subscriptoin : ", subscription);
        const user = UserManager.getInstance().getUser(userId);
        // console.log("user is : ", user);
        UserManager.getInstance().getUser(userId)?.sendMessage(parsedMessage);
      });
    }
  }

  unsubscribe(userId: string, subscription: string) {
    // should be part of the subscription
    if (
      !this.userIdtoSubscription.get(userId) ||
      !this.subscriptionToUser.get(subscription)
    ) {
      return;
    }

    if (!this.userIdtoSubscription.get(userId)?.has(subscription)) {
      return;
    }

    this.userIdtoSubscription.get(userId)?.delete(subscription);
    this.subscriptionToUser.get(subscription)?.delete(userId);

    if (this.subscriptionToUser.get(subscription)?.size == 0) {
      this.subscriptionToUser.delete(subscription);
      this.client.unsubscribe(subscription);
    }
  }

  userLeft(userId: string) {
    const subscriptions = this.userIdtoSubscription.get(userId);
    if (!subscriptions) {
      return;
    }

    for (const [subscription] of subscriptions.entries()) {
      this.unsubscribe(userId, subscription);
    }

    this.userIdtoSubscription.delete(userId);
  }
}

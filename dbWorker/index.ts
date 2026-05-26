import { createClient } from "redis";
import type { DbMessage } from "./types";
import prisma from "./prisma";

async function main() {
  // connect to redis
  const client = createClient();
  await client.connect();

  while (true) {
    const res = await client.rPop("db_processor" as string);
    if (!res) {
    } else {
      const message: DbMessage = JSON.parse(res);

      if (message.type == "TRADE_ADDED") {
        // do something

        try {
          const data = message.data;

          await prisma.trade.create({
            data: {
              tradeId: Number(data.id),
              market: data.market,
              makerOrderId: data.makerOrderId,
              takerOrderId: data.takerOrderId,
              qty: data.quantity,
              price: data.price,
              timestamp: new Date(data.timestamp!),
            },
          });
        } catch (err) {
          console.error(err);
        }
      } else if (message.type == "ORDER_UPDATE") {
        try {
          const data = message.data;

          const existing = await prisma.order.findUnique({
            where: { id: data.orderId },
          });

          const totalFilled =
            (existing?.filledQty ?? 0) + Number(data.executedQty);

          await prisma.order.upsert({
            where: {
              id: data.orderId,
            },
            create: {
              id: data.orderId,
              userId: data.userId!,
              market: data.market!,
              side: data.side == "buy" ? "Buy" : "Sell",
              type: "Market", // TODO:: update it
              qty: data.quantity!,
              price: data.price!,
              filledQty: data.executedQty,
              status:
                data.executedQty.toString() == data.quantity?.toString()
                  ? "FILLED"
                  : Number(data.executedQty) < Number(data.quantity) &&
                      data.executedQty > 0
                    ? "PARTIAL"
                    : "OPEN",
              createdAt: new Date(data.timestamp!),
            },
            update: {
              filledQty: { increment: data.executedQty },
              status:
                totalFilled.toString() == existing?.qty
                  ? "FILLED"
                  : totalFilled < Number(existing?.qty) && data.executedQty > 0
                    ? "PARTIAL"
                    : "OPEN",
            },
          });
        } catch (err) {
          console.error(err);
        }
      }
    }
  }

  main();
}

main();

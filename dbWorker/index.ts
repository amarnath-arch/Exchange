import { createClient } from "redis";
import { KLINE_UPDATE, type DbMessage } from "./types";
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
      console.log("pulling message");
      console.log("message: ", message);

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
      } else if (message.type == KLINE_UPDATE) {
        console.log("processing K lines");
        const data = message.data;
        const existing = await prisma.kLine.findUnique({
          where: {
            symbol_start: {
              symbol: data.market,
              start: new Date(Number(data.start)),
            },
          },
        });

        if (!existing) {
          await prisma.kLine.create({
            data: {
              symbol: data.market,
              open: data.price,
              close: data.price,
              high: data.price,
              low: data.price,
              volume: data.quantity,
              quoteVolume: data.quoteQuantity,
              trades: "1",
              start: new Date(Number(data.start)),
              end: new Date(Number(data.end)),
            },
          });
        } else {
          await prisma.kLine.update({
            where: {
              symbol_start: {
                symbol: data.market,
                start: new Date(Number(data.start)),
              },
            },
            data: {
              close: data.price,
              high: String(Math.max(Number(existing.high), Number(data.price))),
              low: String(Math.min(Number(existing.low), Number(data.price))),
              volume: String(Number(existing.volume) + Number(data.quantity)),
              quoteVolume: String(
                Number(existing.quoteVolume) + Number(data.quoteQuantity),
              ),
              trades: String(Number(existing.trades) + 1),
            },
          });
        }
      } else if (message.type == "ORDER_UPDATE") {
        try {
          const data = message.data;

          const existing = await prisma.order.findUnique({
            where: { id: data.orderId },
          });

          if (!existing) {
            console.log("creating order");
            await prisma.order.create({
              data: {
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
            });
          } else {
            console.log("updating order");

            const totalFilled =
              (existing?.filledQty ?? 0) + Number(data.executedQty);

            await prisma.order.update({
              where: {
                id: data.orderId,
              },
              data: {
                filledQty: { increment: data.executedQty },
                status:
                  totalFilled.toString() == existing?.qty
                    ? "FILLED"
                    : totalFilled < Number(existing?.qty) &&
                        data.executedQty > 0
                      ? "PARTIAL"
                      : "OPEN",
              },
            });
          }

          console.log("order is existing: ", existing);

          // const totalFilled =
          //   (existing?.filledQty ?? 0) + Number(data.executedQty);

          // await prisma.order.upsert({
          //   where: {
          //     id: data.orderId,
          //   },
          //   create: {
          //     id: data.orderId,
          //     userId: data.userId!,
          //     market: data.market!,
          //     side: data.side == "buy" ? "Buy" : "Sell",
          //     type: "Market", // TODO:: update it
          //     qty: data.quantity!,
          //     price: data.price!,
          //     filledQty: data.executedQty,
          //     status:
          //       data.executedQty.toString() == data.quantity?.toString()
          //         ? "FILLED"
          //         : Number(data.executedQty) < Number(data.quantity) &&
          //             data.executedQty > 0
          //           ? "PARTIAL"
          //           : "OPEN",
          //     createdAt: new Date(data.timestamp!),
          //   },
          //   update: {
          //     filledQty: { increment: data.executedQty },
          //     status:
          //       totalFilled.toString() == existing?.qty
          //         ? "FILLED"
          //         : totalFilled < Number(existing?.qty) && data.executedQty > 0
          //           ? "PARTIAL"
          //           : "OPEN",
          //   },
          // });
        } catch (err) {
          console.error(err);
        }
      }
    }
  }

  main();
}

main();

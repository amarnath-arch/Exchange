import { Router } from "express";
import RedisManager from "../../redisManager";
import { CREATE_ORDER, GET_OPEN_ORDERS } from "../../types/types";
import userAuth from "../../auth/userAuth";
import prisma from "../../prisma.auth";

const orderRouter = Router();

orderRouter.post("/", userAuth, async (req, res) => {
  try {
    const { market, price, quantity, side, type } = req.body;
    const [baseAsset, quoteAsset] = market.split("_");

    const priceInt = Number(price);
    const quantityInt = Number(quantity);

    if (
      !Number.isFinite(priceInt) ||
      !Number.isFinite(quantityInt) ||
      quantityInt <= 0
    ) {
      return res.status(411).json({ error: "Invalid price or quantity" });
    }

    const spendAssetName = side === "buy" ? quoteAsset : baseAsset;
    const spendAmount = side === "buy" ? priceInt * quantityInt : quantityInt;

    const balances = await prisma.balance.findMany({
      where: {
        userId: req.userId,
        asset: { name: { in: [baseAsset, quoteAsset] } },
      },
      include: { asset: true },
    });

    const balanceMap = new Map(balances.map((b) => [b.asset.name, b]));
    const spendBalance = balanceMap.get(spendAssetName);

    if (!spendBalance || spendBalance.amount < spendAmount) {
      return res.status(411).json({ error: "Insufficient balance" });
    }

    // deduct BEFORE sending to the engine, using atomic decrement
    await prisma.balance.update({
      where: {
        userId_assetId: {
          userId: req.userId!,
          assetId: spendBalance.assetId,
        },
      },
      data: {
        amount: { decrement: spendAmount },
      },
    });

    // push to the queue
    const response = await RedisManager.getInstance().sendAndAwait({
      type: CREATE_ORDER,
      data: {
        market,
        price,
        quantity,
        side,
        userId: req.userId as string,
        type,
      },
    });

    return res.status(200).json({
      message: "Order created successfully",
      type: response.type,
      payload: response.payload,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: err,
    });
  }
});

orderRouter.get("/open", userAuth, async (req, res) => {
  console.log("getting open orders");
  try {
    const response = await RedisManager.getInstance().sendAndAwait({
      type: GET_OPEN_ORDERS,
      data: {
        userId: req.userId as string,
        market: req.query.market as string,
      },
    });
    return res.json({
      type: "OPEN_ORDERS",
      payload: response.payload,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      error: err,
    });
  }
});

export default orderRouter;

import { Router } from "express";
import userAuth from "../../auth/userAuth";
import RedisManager from "../../redisManager";
import { ON_RAMP } from "../../types/types";
import { v4 as uuid } from "uuid";
import prisma from "../../prisma.auth";

const onRampRouter = Router();

onRampRouter.post("/", userAuth, async (req, res) => {
  // supposedly this is the web hook when the money is onramped

  try {
    const { amount, asset } = req.body;

    const txnId = uuid();

    console.log("here I can get");

    const assetExist = await prisma.asset.findFirst({
      where: {
        name: asset,
      },
    });

    console.log("assetExists");
    console.log(asset);
    console.log(assetExist);

    if (!assetExist) {
      return res.status(411).json({
        error: "Asset does not exist",
      });
    }

    const existing = await prisma.balance.findFirst({
      where: {
        assetId: assetExist.id,
        userId: req.userId,
      },
    });

    console.log(existing);

    if (existing) {
      await prisma.balance.update({
        where: {
          userId_assetId: {
            assetId: assetExist.id,
            userId: req.userId!,
          },
        },
        data: {
          amount: existing.amount + Number(amount),
        },
      });
    } else {
      console.log("So I am somehow getting here");
      console.log(req.userId);
      await prisma.balance.create({
        data: {
          userId: req.userId!,
          amount: Number(amount),
          assetId: assetExist.id,
        },
      });
      // await prisma.balance.create({
      //   data: {
      //     userId: req.userId!,
      //     amount: amount,
      //     assetId: assetExist.id,
      //   },
      // });
      console.log("I can't get here");
    }

    const response = await RedisManager.getInstance().sendAndAwait({
      type: ON_RAMP,
      data: {
        amount: amount,
        userId: req.userId!,
        asset: asset,
        txnId: txnId,
      },
    });

    console.log("response ", response);

    return res.status(200).json({
      message: "On ramp succesful",
      type: response.type,
      payload: response.payload,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      error: err,
    });
  }
});

export default onRampRouter;

import { Router } from "express";
import userAuth from "../../auth/userAuth";
import prisma from "../../prisma.auth";

const balanceRouter = Router();

balanceRouter.get("/", userAuth, async (req, res) => {
  try {
    const assets = await prisma.asset.findMany({});

    const balances = await prisma.balance.findMany({
      where: {
        userId: req.userId,
      },
    });

    const balanceByAssetId = new Map(
      balances.map((b) => [b.assetId, b.amount]),
    );

    // merge: every asset gets a row, missing ones default to 0
    const result = assets.map((asset) => ({
      assetName: asset.name,
      balance: balanceByAssetId.get(asset.id) ?? 0,
    }));

    return res.status(200).json({
      balances: result,
    });
  } catch (err) {
    return res.status(500).json({
      error: err,
    });
  }
});

balanceRouter.get("/:asset", userAuth, async (req, res) => {
  try {
    const { asset } = req.params;
    if (!asset) {
      return res.status(411).json({
        error: "asset not found",
      });
    }
    const assetExist = await prisma.asset.findFirst({
      where: {
        name: asset.toString().toUpperCase(),
      },
    });

    if (!assetExist) {
      return res.status(411).json({
        error: "Asset does not exist",
      });
    }

    const balance = await prisma.balance.findFirst({
      where: {
        userId: req.userId,
        assetId: assetExist.id,
      },
    });

    if (!balance) {
      return res.status(200).json({
        userId: req.userId!,
        asset: asset,
        amount: 0,
      });
    }

    return res.status(200).json({
      balance: balance,
    });
  } catch (err) {
    return res.status(500).json({
      error: err,
    });
  }
});

export default balanceRouter;

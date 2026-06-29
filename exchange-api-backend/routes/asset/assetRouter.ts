import { Router } from "express";
import userAuth from "../../auth/userAuth";
import prisma from "../../prisma.auth";

const assetRouter = Router();

assetRouter.get("/", async (req, res) => {
  try {
    const assets = await prisma.asset.findMany({ select: { name: true } });

    return res.status(200).json({
      assets: assets,
    });
  } catch (err) {
    return res.status(500).json({
      error: err,
    });
  }
});

export default assetRouter;

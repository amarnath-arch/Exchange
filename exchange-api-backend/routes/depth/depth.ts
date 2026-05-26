import { Router } from "express";
import RedisManager from "../../redisManager";
import { GET_DEPTH } from "../../types/types";

const depthRouter = Router();

depthRouter.get("/", async (req, res) => {
  try {
    const { symbol } = req.query;

    const response = await RedisManager.getInstance().sendAndAwait({
      type: GET_DEPTH,
      data: {
        market: symbol as string,
      },
    });

    return res.status(200).json(response.payload);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: err,
    });
  }
});

export default depthRouter;

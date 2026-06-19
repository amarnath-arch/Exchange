import { Router } from "express";
import RedisManager from "../../redisManager";
import { GET_TICKER } from "../../types/types";

const tickersRouter = Router();

tickersRouter.get("/", async (req, res) => {
  try {
    const { symbol } = req.query;

    const response = await RedisManager.getInstance().sendAndAwait({
      type: GET_TICKER,
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

export default tickersRouter;

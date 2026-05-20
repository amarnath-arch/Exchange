import { Router } from "express";
import RedisManager from "../../redisManager";
import { CREATE_ORDER } from "../../types/types";
import userAuth from "../../auth/userAuth";

const orderRouter = Router();

orderRouter.post("/", userAuth, async (req, res) => {
  const { market, price, quantity, side } = req.body;
  // push to the queue
  const response = await RedisManager.getInstance().sendAndAwait({
    type: CREATE_ORDER,
    data: {
      market,
      price,
      quantity,
      side,
      userId: req.userId as string,
    },
  });
});

export default orderRouter;

import { Router } from "express";
import RedisManager from "../../redisManager";
import { CREATE_ORDER } from "../../types/types";
import userAuth from "../../auth/userAuth";

const orderRouter = Router();

orderRouter.post("/", userAuth, async (req, res) => {
  try {
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

export default orderRouter;

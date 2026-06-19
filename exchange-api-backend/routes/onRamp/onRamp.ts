import { Router } from "express";
import userAuth from "../../auth/userAuth";
import RedisManager from "../../redisManager";
import { ON_RAMP } from "../../types/types";
import { v4 as uuid } from "uuid";

const onRampRouter = Router();

onRampRouter.post("/", userAuth, async (req, res) => {
  try {
    const { amount, asset } = req.body;

    const txnId = uuid();

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
    return res.status(500).json({
      error: err,
    });
  }
});

export default onRampRouter;

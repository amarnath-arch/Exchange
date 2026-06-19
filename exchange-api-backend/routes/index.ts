import Router from "express";
import orderRouter from "./order/orderRouter";
import userRouter from "./user/userRouter";
import depthRouter from "./depth/depth";
import onRampRouter from "./onRamp/onRamp";
import tickersRouter from "./ticker/tickerRouter";
import kLineRouter from "./kLine/kLIne";

const indexRouter = Router();

indexRouter.use("/order", orderRouter);
indexRouter.use("/user", userRouter);
indexRouter.use("/depth", depthRouter);
indexRouter.use("/on-ramp", onRampRouter);
indexRouter.use("/tickers", tickersRouter);
indexRouter.use("/kLines", kLineRouter);

export default indexRouter;

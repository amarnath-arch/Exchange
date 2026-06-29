import Router from "express";
import orderRouter from "./order/orderRouter";
import userRouter from "./user/userRouter";
import depthRouter from "./depth/depth";
import onRampRouter from "./onRamp/onRamp";
import tickersRouter from "./ticker/tickerRouter";
import kLineRouter from "./kLine/kLIne";
import balanceRouter from "./balance/balanceRouter";
import assetRouter from "./asset/assetRouter";

const indexRouter = Router();

indexRouter.use("/order", orderRouter);
indexRouter.use("/user", userRouter);
indexRouter.use("/depth", depthRouter);
indexRouter.use("/on-ramp", onRampRouter);
indexRouter.use("/tickers", tickersRouter);
indexRouter.use("/kLines", kLineRouter);
indexRouter.use("/balance", balanceRouter);
indexRouter.use("/assets", assetRouter);

export default indexRouter;

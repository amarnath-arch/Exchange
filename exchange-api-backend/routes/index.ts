import Router from "express";
import orderRouter from "./order/orderRouter";

const indexRouter = Router();

indexRouter.use("/order", orderRouter);

export default indexRouter;

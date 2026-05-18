import Router from "express";
import orderRouter from "./orderRouter";

const indexRouter = Router();

indexRouter.use("/order", orderRouter);

export default indexRouter;

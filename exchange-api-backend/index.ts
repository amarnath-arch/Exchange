import express from "express";
import cors from "cors";
import router from "./routes";

const app = express();

app.use(express.json());
app.use(cors());

app.use("/api/v1", router);

app.listen(process.env.PORT ?? 3005, () => {
  console.log("Api Server Listening on PORT : ", process.env.PORT ?? 3005);
});

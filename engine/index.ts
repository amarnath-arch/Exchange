import { createClient } from "redis";
import Engine from "./trade/Engine";

const main = async () => {
  const engine = new Engine();

  // connect to redis
  const client = createClient();
  await client.connect();

  while (true) {
    const res = await client.rPop("messages" as string);
    if (!res) {
    } else {
      console.log(JSON.parse(res));
      engine.process(JSON.parse(res));
    }
  }
};

main();

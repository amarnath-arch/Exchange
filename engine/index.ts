import { createClient } from "redis";
import Engine from "./trade/Engine";

const main = async () => {
  const engine = new Engine();

  // connect to redis
  const client = createClient();
  await client.connect();

  while (true) {
    client.brPop("messages", 0);
  }
};

main();

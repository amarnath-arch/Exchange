import { PrismaClient } from "./prisma/generated/market-client/client";
import { PrismaPg } from "@prisma/adapter-pg";
const adapter = new PrismaPg({
  connectionString: process.env.MARKET_DATABASE_URL!,
});
const marketClient = new PrismaClient({
  adapter,
});

export default marketClient;

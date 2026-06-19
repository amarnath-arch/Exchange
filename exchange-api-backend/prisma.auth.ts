import { PrismaClient } from "./prisma/generated/auth-client/client";
import { PrismaPg } from "@prisma/adapter-pg";
const adapter = new PrismaPg({
  connectionString: process.env.AUTH_DATABASE_URL!,
});
const prisma = new PrismaClient({
  adapter,
});

export default prisma;

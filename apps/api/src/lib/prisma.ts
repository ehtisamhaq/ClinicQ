import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, Prisma } from "../generated/prisma/client";
import { env } from "../app/config/env";

const connectionString = `${env.DATABASE_URL}`;

const adapter = new PrismaPg({ connectionString });
const prisma: PrismaClient = new PrismaClient({ adapter });

export { prisma, Prisma };
export default prisma;

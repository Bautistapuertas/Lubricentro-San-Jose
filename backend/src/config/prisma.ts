import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.warn(
    "⚠️ ADVERTENCIA: DATABASE_URL no está definida en las variables de entorno. Las consultas a la base de datos requerirán que se configure."
  );
}

const pool = new Pool({
  connectionString: databaseUrl || "postgresql://postgres:postgres@localhost:5432/lubricentro_db",
});
const adapter = new PrismaPg(pool);

export const prisma = new PrismaClient({ adapter });

export { pool };

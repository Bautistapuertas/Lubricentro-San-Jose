import "dotenv/config";

function obligatorio(nombre: string): string {
  const valor = process.env[nombre];
  if (!valor) {
    throw new Error(`Falta la variable de entorno ${nombre} en el .env`);
  }
  return valor;
}

export const JWT_SECRET = obligatorio("JWT_SECRET");
export const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? "24h";
export const SALT_ROUNDS = Number(process.env.SALT_ROUNDS ?? 10);
export const PORT = Number(process.env.PORT ?? 3000);
export const FRONTEND_URL = process.env.FRONTEND_URL ?? "http://localhost:5173";

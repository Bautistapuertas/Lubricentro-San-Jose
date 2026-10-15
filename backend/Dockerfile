# ---------- BACKEND (Express + PostgreSQL + Prisma + TypeScript) ----------
FROM node:22-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Generar cliente Prisma y compilar TypeScript a dist/
RUN npx prisma generate && npm run build

FROM node:22-alpine

WORKDIR /app

COPY --from=build /app/package*.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma

EXPOSE 3000

CMD ["sh", "-c", "if [ -n \"$DATABASE_URL\" ]; then npx prisma db push --skip-generate || true; fi; node dist/index.js"]

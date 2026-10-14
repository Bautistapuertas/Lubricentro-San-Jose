# ---------- BACKEND (Express + PostgreSQL) ----------
FROM node:22-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci --ignore-scripts --no-optional

COPY . .

# Solo compilar con tsc
RUN npm run build

FROM node:22-alpine

WORKDIR /app

COPY --from=build /app/package*.json ./
RUN npm ci --only=production --ignore-scripts --no-optional

# Copiar el código compilado y los esquemas/PRISMA estáticos si los necesita
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma

EXPOSE 3000

USER node

CMD ["npm", "start"]

FROM node:24-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install

COPY . .
RUN npm run build

FROM node:24-alpine

WORKDIR /app

COPY --from=build /app/.output .output

# Словари для игр: кладём в образ вне staticfiles, чтобы их не перекрыл
# возможный volume на /app/staticfiles. При старте сервер засеет их в
# staticfiles/games/dicts (см. server/plugins/seed-dicts.ts).
COPY --from=build /app/staticfiles/games/dicts ./dicts-seed

ENV HOST=0.0.0.0
ENV PORT=3000
ENV NUXT_API=http://api-gateway:8080
ENV NUXT_PUBLIC_API=http://localhost:8080

EXPOSE 3000

CMD ["node", ".output/server/index.mjs"]
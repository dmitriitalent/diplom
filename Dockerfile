# FROM node:22-alpine AS build

# WORKDIR /app

# COPY package.json package-lock.json ./
# RUN npm ci

# COPY . .
# RUN npm run build

# FROM node:22-alpine

# WORKDIR /app

# COPY --from=build /app/.output .output

# ENV HOST=0.0.0.0
# ENV PORT=3000
# ENV NUXT_API=http://api-gateway:8080
# ENV NUXT_PUBLIC_API=http://localhost:8080

# EXPOSE 3000

# CMD ["node", ".output/server/index.mjs"]

FROM node:22-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install

# код НЕ копируем — он будет через volume

ENV HOST=0.0.0.0
ENV PORT=3000

EXPOSE 3000

CMD ["npm", "run", "dev"]

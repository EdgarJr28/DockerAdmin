# ===== Build =====
FROM node:20-alpine AS build
WORKDIR /app

# Instala TODAS las dependencias (incluyendo dev)
COPY package*.json ./
ENV NODE_ENV=development
RUN npm ci

COPY . .
RUN npm run build

# ===== Run =====
FROM node:20-alpine AS run
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3010

COPY --from=build /app ./
EXPOSE 3010
CMD ["npx","next","start","-p","3010","-H","0.0.0.0"]

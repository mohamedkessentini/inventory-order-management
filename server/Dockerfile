# --- Build stage ---
FROM node:20-alpine AS build
WORKDIR /build

COPY package*.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# --- Run stage ---
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=build /build/dist ./dist

RUN addgroup -S app && adduser -S app -G app
USER app:app

EXPOSE 4100
CMD ["node", "dist/server.js"]

# --- Build stage ---
FROM node:20-alpine AS build
WORKDIR /build

COPY package*.json ./
RUN npm install --legacy-peer-deps

COPY . .
# Baked in at build time since Angular inlines environment.ts into the compiled bundle.
ARG API_URL=http://localhost:4100/api
RUN sed -i "s#http://localhost:4100/api#${API_URL}#" src/environments/environment.ts
RUN npm run build

# --- Run stage ---
FROM nginx:1.27-alpine
COPY --from=build /build/dist/client/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

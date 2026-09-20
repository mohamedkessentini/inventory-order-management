# --- Build stage ---
# Angular 22's CLI requires Node >=22.22.3/24.15.0/26.0.0 - node:20 (used by the other two
# services' Dockerfiles) is too old and fails the build with an engine-version error.
FROM node:22-alpine AS build
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

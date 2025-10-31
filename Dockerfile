# ---- Build Angular ----
FROM node:20-alpine AS build
WORKDIR /app
# Fix OpenSSL (Angular/Webpack viejos con Node 18/20)
ENV NODE_OPTIONS=--openssl-legacy-provider
COPY package*.json ./
RUN npm ci
COPY . .
# Build prod (usa environment.prod.ts por tu angular.json)
RUN npm run build -- --configuration production

# ---- Runtime ----
FROM node:20-alpine
WORKDIR /app
RUN npm i -g serve
# Copiamos TODO dist y luego elegimos la carpeta correcta en CMD
COPY --from=build /app/dist /dist

ENV NODE_ENV=production
EXPOSE 8080
# Detecta si el build quedó en /dist/ad_samaria/browser (Angular +15) o /dist/ad_samaria (más viejo)
CMD sh -c '\
  ROOT_DIR="/dist/ad_samaria"; \
  if [ -d "/dist/ad_samaria/browser" ]; then ROOT_DIR="/dist/ad_samaria/browser"; fi; \
  echo "Serving from: $ROOT_DIR"; \
  # MUY IMPORTANTE: bind a 0.0.0.0 y al $PORT de Railway
  serve -s -l tcp://0.0.0.0:${PORT:-8080} "$ROOT_DIR" \
'

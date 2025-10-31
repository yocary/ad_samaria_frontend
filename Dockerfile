# Etapa 1: Build Angular
FROM node:20-alpine AS build
WORKDIR /app
ENV NODE_OPTIONS=--openssl-legacy-provider  
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build -- --configuration production

# Etapa 2: Servir estáticos
FROM node:20-alpine
WORKDIR /app
COPY --from=build /app/dist/ad_samaria /app
RUN npm i -g serve
ENV NODE_ENV=production
EXPOSE 8080
CMD ["sh", "-c", "serve -s -l ${PORT:-8080} /app"]

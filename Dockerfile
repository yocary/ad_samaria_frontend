# Etapa 1: Build Angular
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# Asegúrate que "ng" esté disponible, si no está como devDep:
# RUN npm i -g @angular/cli
RUN npm run build -- --configuration production
# Alternativa directa:
# RUN npx ng build --configuration production

# Etapa 2: Servir estáticos
FROM node:20-alpine
WORKDIR /app
# Copia el build a /app
COPY --from=build /app/dist/ad_samaria /app
# Instala un server estático con fallback SPA
RUN npm i -g serve

# Railway asigna PORT en runtime
ENV NODE_ENV=production
EXPOSE 8080
# Usa el puerto que da Railway y 0.0.0.0
CMD ["sh", "-c", "serve -s -l ${PORT:-8080} /app"]

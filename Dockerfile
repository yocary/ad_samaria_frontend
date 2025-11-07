# Etapa 1: Construir la aplicación Angular
FROM node:14 AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install

COPY . .
RUN npm run build -- --configuration production

# Etapa 2: Servir la aplicación Angular como SPA
FROM node:14

# 1) Instala "serve" que soporta fallback a index.html (-s)
RUN npm i -g serve

# 2) Carpeta de runtime
WORKDIR /app

# 3) Copia el build (ajusta "ad_samaria" si tu carpeta dist tiene otro nombre)
COPY --from=build /app/dist/ad_samaria /app

# 4) Expón un puerto (Railway usará $PORT). Usa 8080 por convención.
EXPOSE 8080

# 5) Arranca serve en modo single-page (-s) y liga al puerto que pone Railway
#    Si PORT no existe (local), usa 8080.
CMD ["sh", "-c", "serve -s /app -l ${PORT:-8080}"]

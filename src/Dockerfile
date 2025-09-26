# Etapa 1: Construir la aplicación Angular
FROM node:14 AS build

# Establece el directorio de trabajo dentro del contenedor
WORKDIR /app

# Copia package.json y package-lock.json al directorio de trabajo
COPY package.json package-lock.json ./

# Instala las dependencias
RUN npm install

# Copia el resto del código fuente de la aplicación al directorio de trabajo
COPY . .

# Construye la aplicación Angular en modo producción
RUN npm run build --prod

# Etapa 2: Servir la aplicación Angular con Node.js
FROM node:14

# Establece el directorio de trabajo dentro del contenedor
WORKDIR /app

# Copia los archivos estáticos generados por la construcción de la aplicación Angular desde la etapa anterior
COPY --from=build /app/dist/ad_samaria /app

# Instala un servidor http simple para servir la aplicación Angular
RUN npm install -g http-server

# Expone el puerto 4200 al mundo exterior
EXPOSE 4200

# Comando para iniciar el servidor http para servir la aplicación Angular en el puerto 4200
CMD ["http-server", "-p", "4200"]
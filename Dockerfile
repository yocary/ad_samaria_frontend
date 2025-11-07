# ============================
# Etapa 1: Construir la aplicación Angular
# ============================
FROM node:14 AS build

# Directorio de trabajo
WORKDIR /app

# Copiar dependencias e instalarlas
COPY package.json package-lock.json ./
RUN npm ci

# Copiar el resto del código fuente
COPY . .

# Construir la app Angular en modo producción
RUN npm run build -- --configuration production

# ============================
# Etapa 2: Servir la aplicación Angular como SPA
# ============================
FROM node:14

# Directorio de trabajo
WORKDIR /app

# Copiar el build generado
# ⚠️ Asegúrate de que la carpeta sea correcta (verifica que sea /dist/ad_samaria)
COPY --from=build /app/dist/ad_samaria /app

# Instalar el servidor estático "serve" (SPA-friendly)
RUN npm install -g serve

# Exponer el puerto 4200
EXPOSE 4200

# Comando para iniciar la app en modo SPA y bind en 0.0.0.0
# -s = single-page app (todas las rutas apuntan a index.html)
# -l = listen en 0.0.0.0:4200
CMD ["serve", "-s", "/app", "-l", "tcp://0.0.0.0:4200"]

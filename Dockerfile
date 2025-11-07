# Etapa 1: build Angular
FROM node:18-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./ 
RUN npm ci
COPY . .
# Ojo: ajusta el nombre de la carpeta de salida si no es "ad_samaria"
RUN npm run build -- --configuration production

# Etapa 2: servir como SPA con "serve"
FROM node:18-alpine

# 1) Instala serve
RUN npm i -g serve

# 2) Copia el build
WORKDIR /app
# ⚠️ Ajusta 'ad_samaria' si tu proyecto genera otro nombre (p.ej. ad-samaria)
COPY --from=build /app/dist/ad_samaria /app

# 3) Script de arranque que valida que existe index.html y escucha en 0.0.0.0:$PORT
RUN printf '#!/bin/sh\n\
set -e\n\
if [ ! -f /app/index.html ]; then\n\
  echo "[ERROR] No existe /app/index.html. Revisa el nombre de carpeta en dist/*" >&2\n\
  echo "Contenido de /app:"; ls -la /app || true\n\
  exit 1\n\
fi\n\
PORT_TO_USE=${PORT:-8080}\n\
echo "Iniciando serve en 0.0.0.0:${PORT_TO_USE} (SPA mode)..."\n\
exec serve -s /app -l tcp://0.0.0.0:${PORT_TO_USE}\n' > /start.sh && chmod +x /start.sh

EXPOSE 8080
CMD ["/start.sh"]

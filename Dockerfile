# Build Angular
FROM node:18-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build -- --configuration production

# Servir con Nginx (SPA)
FROM nginx:1.25-alpine
# Copia el build a la raíz pública
# ⚠️ Ajusta 'ad_samaria' si tu carpeta de dist se llama distinto
COPY --from=build /app/dist/ad_samaria /usr/share/nginx/html
# Configuración SPA: cualquier ruta -> index.html
COPY <<'NGINX' /etc/nginx/conf.d/default.conf
server {
  listen 8080;
  server_name _;
  root /usr/share/nginx/html;
  index index.html;

  # Archivos estáticos
  location / {
    try_files $uri $uri/ /index.html;
  }

  # Tamaños/headers opcionales
  client_max_body_size 10m;
  add_header Cache-Control "public, max-age=0";
}
NGINX

EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]

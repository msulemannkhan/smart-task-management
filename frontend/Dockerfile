# Frontend Dockerfile for Vite React app served by nginx

FROM node:20-alpine AS build

# Build arguments for API configuration (must be after FROM)
ARG VITE_API_URL=http://localhost:9200
ARG VITE_WS_URL=ws://localhost:9200

WORKDIR /app

# Pass build args as environment variables for Vite build
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_WS_URL=$VITE_WS_URL

COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:1.27-alpine AS runtime
COPY --from=build /app/dist /usr/share/nginx/html

# Nginx config for SPA routing and optional API proxy via env
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]



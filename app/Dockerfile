# SPDX-License-Identifier: Apache-2.0
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Vite inlines VITE_* at build time, so they must be build args (not runtime env)
ARG VITE_API_BASE_URL=/api/v1
ARG VITE_KEYCLOAK_URL=""
ARG VITE_KEYCLOAK_REALM=dx-fsm
ARG VITE_KEYCLOAK_CLIENT_ID=dx-fsm-frontend

RUN npm run build

# Production stage
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 3000

CMD ["nginx", "-g", "daemon off;"]

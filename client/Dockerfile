FROM node:20-alpine3.20 AS build

# Установка зависимостей для Alpine
RUN apk add --no-cache python3 make g++

# Создаем пользователя
RUN addgroup -S appgroup && adduser -S appuser -G appgroup -u 1001
WORKDIR /app
COPY --chown=appuser:appgroup package*.json ./

# Чистим кэш и устанавливаем зависимости
RUN npm cache clean --force && \
    npm install --no-optional --legacy-peer-deps

# Копируем исходный код
COPY --chown=appuser:appgroup . .

# Сборка проекта (обратите внимание на выходную папку)
RUN npm run build && \
    mkdir -p /app/dist && \
    mv /app/build/* /app/dist/  # Если React создает build вместо dist

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
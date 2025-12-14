FROM node:20-alpine3.20

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
ENV TZ=Europe/Moscow
EXPOSE 5000
CMD ["node", "server.js"]
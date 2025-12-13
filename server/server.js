require('dotenv').config();
const express = require("express");
const cookieParser = require('cookie-parser');
const cors = require("cors");
const app = express();
const path = require('path');
const { Op } = require("sequelize");

const telegramBot = require('./services/initTelegram');

const sequelize = require("./db");
const router = require('./router/index');
const errorMiddleware = require('./middlewares/error_middleware.js');
const { updateSeanceStatuses } = require('./services/updateSeanceStatuses.js');
const SeanceService = require('./services/SeanceService.js');
const WebSocketServer = require('./websocket');


const PORT = process.env.PORT || 5000;

sequelize.authenticate()
  .then(() => console.log('Подключение к базе данных прошло успешно.'))
  .catch(err => console.error('Невозможно подключиться к базе данных:', err));

sequelize.sync({ alter: true })
  .then(async () => {
    console.log("Модели синхронизированы с базой данных.");
    SeanceService.initScheduler();
  })
  .catch(error => console.error("Ошибка синхронизации:", error));

// Настройка Express
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({ credentials: true, origin: process.env.CLIENT_URL }));
app.use(cookieParser());
app.use('/api', router);
app.use('/img/shows', express.static(path.join(__dirname, 'img/shows')));
app.use(errorMiddleware);

// Запуск сервера
const httpServer = app.listen(PORT, () => {
  console.log(`Server is running on ${PORT}`);
  
  const wsServer = new WebSocketServer(httpServer);  
  console.log('Все сервисы инициализированы');
  SeanceService.initScheduler();
  app.set('wsServer', wsServer);
  
});

setInterval(updateSeanceStatuses, 60 * 1000);

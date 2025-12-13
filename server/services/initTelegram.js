const TelegramService = require('./TelegramService');

// Создаем и сразу экспортируем экземпляр
const telegramBot = new TelegramService(process.env.TELEGRAM_TOKEN || '8154083985:AAFZibZaxsz5u9n3QNmBJc64VYych6NlLIw');

// Экспортируем экземпляр, чтобы можно было импортировать в других файлах
module.exports = telegramBot;
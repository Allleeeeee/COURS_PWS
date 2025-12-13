const TelegramBot = require('node-telegram-bot-api');
const { Users } = require("../models/models.js");
const { Op } = require('sequelize');

let instance = null;

class TelegramService {
    constructor(token) {
        if (instance) {
            return instance;
        }
        
        this.bot = new TelegramBot(token, { polling: true });
        this.setupHandlers();
        instance = this;
    }

    static getInstance(token) {
        if (!instance) {
            instance = new TelegramService(token);
        }
        return instance;
    }

    setupHandlers() {
        // Обработка команды /start - показывает меню
        this.bot.onText(/\/start/, (msg) => {
            const chatId = msg.chat.id;
            this.showMainMenu(chatId);
        });

        // Обработка команды /link - привязка аккаунта
        this.bot.onText(/\/link/, async (msg) => {
            const chatId = msg.chat.id;
            this.bot.sendMessage(
                chatId,
                '🔑 Введите 6-значный код из приложения для привязки аккаунта:'
            );
        });

        // Обработка команды /unlink - отвязка аккаунта
        this.bot.onText(/\/unlink/, async (msg) => {
            const chatId = msg.chat.id;
            await this.unlinkAccount(chatId);
        });

        // Обработка ввода кода вручную
        this.bot.on('message', async (msg) => {
            const chatId = msg.chat.id;
            const text = msg.text;

            // Игнорируем команды
            if (text.startsWith('/')) return;

            // Проверяем, что введено 6 цифр
            if (/^\d{6}$/.test(text)) {
                await this.handleCode(chatId, text);
            } else {
                this.bot.sendMessage(
                    chatId,
                    '❌ Код должен состоять из 6 цифр. Попробуйте еще раз.'
                );
            }
        });
    }

    // Показывает главное меню с командами
    showMainMenu(chatId) {
        const options = {
            reply_markup: {
                keyboard: [
                    ['/link - Привязать аккаунт'],
                    ['/unlink - Отписаться от уведомлений']
                ],
                resize_keyboard: true,
                one_time_keyboard: true
            }
        };

        this.bot.sendMessage(
            chatId,
            '👋 Добро пожаловать! Выберите действие:',
            options
        );
    }

    async handleCode(chatId, code) {
        try {
            // Находим пользователя с таким кодом
            const user = await Users.findOne({
                where: { TelegramCode: code }
            });

            if (!user) {
                this.bot.sendMessage(
                    chatId,
                    '❌ Код не найден. Проверьте правильность или запросите новый в приложении.'
                );
                return;
            }

            // Проверяем, не привязан ли уже этот chatId к другому аккаунту
            const existingUser = await Users.findOne({
                where: { TelegramChatId: chatId }
            });

            if (existingUser && existingUser.ID !== user.ID) {
                this.bot.sendMessage(
                    chatId,
                    '❌ Этот Telegram-аккаунт уже привязан к другому пользователю.'
                );
                return;
            }

            // Обновляем пользователя, сохраняя chat_id и очищая код
            await user.update({
                TelegramCode: null,
                TelegramChatId: chatId
            });

            this.bot.sendMessage(
                chatId,
                `✅ Аккаунт успешно привязан! Вы будете получать уведомления о событиях.`
            );
        } catch (error) {
            console.error('Ошибка привязки Telegram:', error);
            this.bot.sendMessage(
                chatId,
                '⚠️ Произошла ошибка. Попробуйте позже.'
            );
        }
    }

    // Отвязка аккаунта от уведомлений
    async unlinkAccount(chatId) {
        try {
            const user = await Users.findOne({
                where: { TelegramChatId: chatId }
            });

            if (!user) {
                this.bot.sendMessage(
                    chatId,
                    '❌ Ваш аккаунт не привязан к уведомлениям.'
                );
                return;
            }

            await user.update({
                TelegramChatId: null
            });

            this.bot.sendMessage(
                chatId,
                '🔕 Вы успешно отписались от уведомлений. Чтобы снова подписаться, используйте /link.'
            );
        } catch (error) {
            console.error('Ошибка отвязки Telegram:', error);
            this.bot.sendMessage(
                chatId,
                '⚠️ Произошла ошибка. Попробуйте позже.'
            );
        }
    }

    // Метод для генерации 6-значного кода
    static async generateCode(userId) {
        const code = Math.floor(100000 + Math.random() * 900000);
        await Users.update(
            { TelegramCode: code },
            { where: { ID: userId } }
        );
        return code;
    }

    // Метод для отправки уведомления
    async sendNotification(chatId, message) {
        try {
            await this.bot.sendMessage(chatId, message);
        } catch (error) {
            console.error('Ошибка отправки уведомления:', error);
        }
    };

    // Массовая рассылка уведомлений
    async sendBroadcastNotification(message) {
        try {
            // Находим всех пользователей с chat_id
            const users = await Users.findAll({
                where: {
                    TelegramChatId: {
                        [Op.not]: null
                    }
                }
            });

            // Отправляем сообщение каждому
            for (const user of users) {
                try {
                    await this.bot.sendMessage(
                        user.TelegramChatId, 
                        message,
                        { parse_mode: 'HTML' }
                    );
                } catch (error) {
                    console.error(`Ошибка отправки пользователю ${user.ID}:`, error);
                    // Если бот заблокирован, удаляем chat_id
                    if (error.response?.statusCode === 403) {
                        await user.update({ TelegramChatId: null });
                    }
                }
            }

            return users.length;
        } catch (error) {
            console.error('Ошибка массовой рассылки:', error);
            throw error;
        }
    };

    // Уведомление об отмене сеанса
    async sendCancellationNotification(userIds, seanceInfo) {
        try {
            const users = await Users.findAll({
                where: {
                    ID: userIds,
                    TelegramChatId: {
                        [Op.not]: null
                    }
                },
                attributes: ['ID', 'TelegramChatId']
            });

            if (users.length === 0) {
                console.log('Нет пользователей с Telegram для уведомления');
                return 0;
            }

            const { showTitle, theatreName, seanceDate, seanceTime } = seanceInfo;
            
            const message = `❌ <b>Уведомление об отмене сеанса</b>\n\n` +
                          `📌 <b>${showTitle}</b>\n` +
                          `📅 Дата: ${seanceDate}\n` +
                          `🕒 Время: ${seanceTime}\n` +
                          `🏛 Театр: ${theatreName}\n\n` +
                          `К сожалению, сеанс был отменён. Приносим извинения за доставленные неудобства.\n\n` +
                          `Следите за обновлениями в приложении AfishaApp`;

            let sentCount = 0;
            for (const user of users) {
                try {
                    await this.bot.sendMessage(
                        user.TelegramChatId, 
                        message,
                        { parse_mode: 'HTML' }
                    );
                    sentCount++;
                } catch (error) {
                    console.error(`Ошибка отправки пользователю ${user.ID}:`, error);
                    if (error.response?.statusCode === 403) {
                        await Users.update(
                            { TelegramChatId: null },
                            { where: { ID: user.ID } }
                        );
                    }
                }
            }

            return sentCount;
        } catch (error) {
            console.error('Ошибка отправки уведомлений об отмене:', error);
            throw error;
        }
    };

    // Уведомление о переносе сеанса
    async sendRescheduleNotification(userIds, seanceInfo) {
        try {
            const users = await Users.findAll({
                where: {
                    ID: userIds,
                    TelegramChatId: {
                        [Op.not]: null
                    }
                },
                attributes: ['ID', 'TelegramChatId']
            });

            if (users.length === 0) {
                console.log('Нет пользователей с Telegram для уведомления');
                return 0;
            }

            const { 
                showTitle, 
                theatreName, 
                oldDate, 
                oldTime, 
                newDate, 
                newTime 
            } = seanceInfo;
            
            const message = `🔄 <b>Уведомление о переносе сеанса</b>\n\n` +
                          `📌 <b>${showTitle}</b>\n` +
                          `🏛 Театр: ${theatreName}\n\n` +
                          `📅 <b>Переносится с:</b> ${oldDate} в ${oldTime}\n` +
                          `📅 <b>На:</b> ${newDate} в ${newTime}\n\n` +
                          `Приносим извинения за доставленные неудобства.\n\n` +
                          `Ваши билеты остаются действительными на новое время.\n`;

            let sentCount = 0;
            for (const user of users) {
                try {
                    await this.bot.sendMessage(
                        user.TelegramChatId, 
                        message,
                        { parse_mode: 'HTML' }
                    );
                    sentCount++;
                } catch (error) {
                    console.error(`Ошибка отправки пользователю ${user.ID}:`, error);
                    if (error.response?.statusCode === 403) {
                        await Users.update(
                            { TelegramChatId: null },
                            { where: { ID: user.ID } }
                        );
                    }
                }
            }

            return sentCount;
        } catch (error) {
            console.error('Ошибка отправки уведомлений о переносе:', error);
            throw error;
        }
    };

    async sendShowChangeNotification(userIds, changeInfo) {
    try {
        const users = await Users.findAll({
            where: {
                ID: userIds,
                TelegramChatId: {
                    [Op.not]: null
                }
            },
            attributes: ['ID', 'TelegramChatId']
        });

        if (users.length === 0) {
            console.log('Нет пользователей с Telegram для уведомления');
            return 0;
        }

        const { 
            oldShowTitle, 
            newShowTitle, 
            theatreName,
            date,
            time
        } = changeInfo;
        
        const message = `🔄 <b>Уведомление о замене постановки</b>\n\n` +
                      `🏛 Театр: ${theatreName}\n` +
                      `📅 Дата: ${date}\n` +
                      `🕒 Время: ${time}\n\n` +
                      `Произошла замена сеанса:\n` +
                      `❌ Было: <b>${oldShowTitle}</b>\n` +
                      `✅ Стало: <b>${newShowTitle}</b>\n\n` +
                      `Приносим извинения за доставленные неудобства.\n` +
                      `Ваши билеты остаются действительными на новый спектакль.\n` +
                      `Если вас не устраивает замена, вы можете вернуть билеты в личном кабинете.`;

        let sentCount = 0;
        for (const user of users) {
            try {
                await this.bot.sendMessage(
                    user.TelegramChatId, 
                    message,
                    { parse_mode: 'HTML' }
                );
                sentCount++;
            } catch (error) {
                console.error(`Ошибка отправки пользователю ${user.ID}:`, error);
                if (error.response?.statusCode === 403) {
                    await Users.update(
                        { TelegramChatId: null },
                        { where: { ID: user.ID } }
                    );
                }
            }
        }

        return sentCount;
    } catch (error) {
        console.error('Ошибка отправки уведомлений о замене постановки:', error);
        throw error;
    }
};
}

module.exports = TelegramService;
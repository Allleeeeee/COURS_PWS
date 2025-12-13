// const { Seances, Tickets, Users, Shows, Theatres } = require("../models/models.js");
// const TelegramService = require("./TelegramService");
// const { Op } = require('sequelize');

// class SchedulerService {
//     constructor(telegramBot) {  
//         this.telegramBot = telegramBot;
//         this.notifiedSeances = new Set();
//     }

//     async initScheduler() {
//         setInterval(async () => {
//             try {
//                const nowUTC = new Date();
//                 const nowLocal = new Date(nowUTC.getTime() + (3 * 60 * 60 * 1000));
//                 const next24Hours = new Date(nowLocal.getTime() + 24 * 60 * 60 * 1000);

//                 console.log(`\n--- Проверка сеансов [${nowLocal.toISOString()}] ---`);
//                 console.log(`Диапазон поиска: ${nowLocal.toISOString()} - ${next24Hours.toISOString()}`);
//                 console.log(`Исключаемые ID: ${Array.from(this.notifiedSeances).join(', ') || 'нет'}`);

//                 const upcomingSeances = await Seances.findAll({
//                     where: {
//                         Start_time: {
//                             [Op.between]: [
//                                 new Date(nowLocal.getTime() - 3 * 60 * 60 * 1000), 
//                                 new Date(next24Hours.getTime() - 3 * 60 * 60 * 1000)
//                             ]
//                         },
//                         ID: {
//                             [Op.notIn]: Array.from(this.notifiedSeances)
//                         }
//                     },
//                     include: [
//                         { model: Shows, attributes: ['Title'] },
//                         { model: Theatres, attributes: ['ThName'] }
//                     ]
//                 });

//                 console.log(`Найдено сеансов в диапазоне: ${upcomingSeances.length}`);
//                 upcomingSeances.forEach(s => {
//                     console.log(`  ID: ${s.ID}, Start: ${s.Start_time.toISOString()}, "${s.Show.Title}"`);
//                 });

//                 if (upcomingSeances.length === 0) {
//                     console.log("Нет новых сеансов в ближайшие 24 часа.");
//                     return;
//                 }

//                 // ОТПРАВКА УВЕДОМЛЕНИЙ (ДОБАВЛЕННАЯ ЧАСТЬ)
//                 for (const seance of upcomingSeances) {
//                     const tickets = await Tickets.findAll({
//                         where: { Seance_id: seance.ID },
//                         include: [{
//                             model: Users,
//                             where: { TelegramChatId: { [Op.not]: null } },
//                             attributes: ['TelegramChatId']
//                         }]
//                     });

//                     if (tickets.length === 0) {
//                         console.log(`На сеанс "${seance.Show.Title}" нет билетов.`);
//                         continue;
//                     }

//                     const timeString = seance.Start_time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
//                     const message = `🎭 Напоминаем, ${this.getTimeLeftText(seance.Start_time)} состоится "${seance.Show.Title}" в ${seance.Theatre.ThName}. Начало в ${timeString}. Приятного просмотра!`;

//                     for (const ticket of tickets) {
//                         if (ticket.User.TelegramChatId) {
//                             await this.telegramBot.sendNotification(
//                                 ticket.User.TelegramChatId,
//                                 message
//                             ).catch(e => console.error(`Ошибка отправки: ${e}`));
//                         }
//                     }

//                     this.notifiedSeances.add(seance.ID);
//                     console.log(`Уведомления отправлены для сеанса "${seance.Show.Title}" (ID: ${seance.ID})`);
//                 }

//             } catch (error) {
//                 console.error("Ошибка в планировщике:", error);
//             }
//         }, 5000* 60);
//     }

//     getTimeLeftText(startTime) {
//         const now = new Date();
//         const diffHours = Math.floor((startTime - now) / (1000 * 60 * 60));
        
//         if (diffHours >= 24) return `завтра`;
//         if (diffHours >= 1) return `через ${diffHours} ${this.pluralize(diffHours, 'час', 'часа', 'часов')}`;
        
//         const diffMinutes = Math.floor((startTime - now) / (1000 * 60));
//         return `через ${diffMinutes} ${this.pluralize(diffMinutes, 'минуту', 'минуты', 'минут')}`;
//     }

//     pluralize(number, one, few, many) {
//         const n = Math.abs(number) % 100;
//         const n1 = n % 10;
//         if (n > 10 && n < 20) return many;
//         if (n1 > 1 && n1 < 5) return few;
//         if (n1 === 1) return one;
//         return many;
//     }
// }

// module.exports = SchedulerService;
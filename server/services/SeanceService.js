const { where } = require("sequelize");
const { Op } = require("sequelize");
const moment = require("moment-timezone"); 
const {Theatres, Rows, Seats,Users, TokenShemes, Managers, Casts, Shows, ShowCasts, Seances, Tickets} = require("../models/models.js");
const ApiError = require('../exceptions/apierror.js')
const cron = require('node-cron');
const sequelize = require("../db.js");
const TelegramService = require("./TelegramService.js");
const telegramBot = require('./initTelegram');

class SeanceService {
    constructor() {
    this.notificationService = null;
  }

  setNotificationService(notificationService) {
    this.notificationService = notificationService;
  }

    initScheduler() {
    cron.schedule('* * * * * *', async () => {
        try {
          const now = new Date();
          now.setHours(now.getHours() + 3);
       
          const expiredSeances = await Seances.findAll({
            where: {
              Start_time: { [Op.lt]: now }, 
              Status: 'Не проведён'
            }
          });
      
          if (expiredSeances.length > 0) {
            const seanceIds = expiredSeances.map(seance => seance.ID);
        
            await Tickets.update(
              { Status: 'Не активно' },
              { 
                where: { 
                  Seance_id: { [Op.in]: seanceIds }
                  //Status: 'Занято'
                }
              }
            );
            await Seances.update(
              { Status: 'Проведён' },
              { 
                where: { 
                  ID: { [Op.in]: seanceIds }
                }
              }
            );
      
            console.log(`Обновлено ${expiredSeances.length} сеансов и связанных билетов`);
          }
        } catch (err) {
          console.error('Ошибка в планировщике:', err);
        }
      });
    };

    async getSeances(){
        const seances = await Seances.findAll();
        return seances;
    }

    async getSeanceById(id){
        const seance = await Seances.findByPk(id);
        return seance;
    }
 
    async getSeancesByDate(date) {
        const startOfDay = moment(date).startOf("day").toDate();
        const endOfDay = moment(date).endOf("day").toDate();
    
        const seances = await Seances.findAll({
            where: {Start_time: {[Op.between]: [startOfDay, endOfDay]}}});
    
        return seances;
    }

  async addSeance(theatre_id, manager_user_id, show_id, start_time, end_time, status) {
    const manager = await Managers.findOne({
        where: {
            User_id: manager_user_id
        },
        rejectOnEmpty: true
    }).catch(() => {
        throw ApiError.BadRequest("Менеджер не найден");
    });

    if (Number(manager.Theatre_id) !== Number(theatre_id)) {
        throw ApiError.ForbiddenError();
    }

    const startMoment = moment(start_time);
    const endMoment = moment(end_time);
    const today = moment().startOf("day");
    
    // Проверка что сеанс не в прошлом
    if (startMoment.isBefore(today)) {
        throw ApiError.BadRequest("Нельзя добавить сеанс на прошедшую дату.");
    }

    // Проверка что время окончания позже времени начала
    if (!endMoment.isAfter(startMoment)) {
        throw ApiError.BadRequest("Время окончания должно быть позже времени начала.");
    }

    // Проверка минимальной длительности сеанса (1 час)
    if (endMoment.diff(startMoment, 'minutes') < 60) {
        throw ApiError.BadRequest("Минимальная длительность сеанса - 1 час.");
    }

    // Проверка что начало и конец в один день
    if (
        startMoment.year() !== endMoment.year() ||
        startMoment.month() !== endMoment.month() ||
        startMoment.date() !== endMoment.date()
    ) {
        throw ApiError.BadRequest("Дата начала и окончания сеанса должны быть в пределах одного дня.");
    }

    const startHour = startMoment.hour();
    const endHour = endMoment.hour();
    if ((startHour >= 23 || startHour < 7) || (endHour > 23 || endHour <= 7)) {
        throw ApiError.BadRequest("Сеансы нельзя ставить в ночное время (с 23:00 до 7:00).");
    }
    const startFormatted = moment(start_time).format("YYYY-MM-DD HH:mm");
    const endFormatted = moment(end_time).format("YYYY-MM-DD HH:mm");

    // Проверка пересечения с другими сеансами
    const existingSeance = await Seances.findOne({
        where: {
            Theatre_id: theatre_id,
            [Op.or]: [
                {
                    Start_time: { [Op.lt]: endFormatted },
                    End_time: { [Op.gt]: startFormatted }
                },
                {
                    Start_time: { [Op.between]: [startFormatted, endFormatted] }
                },
                {
                    End_time: { [Op.between]: [startFormatted, endFormatted] }
                }
            ]
        }
    });

    if (existingSeance) {
        throw ApiError.BadRequest("Сеанс на это время уже существует.");
    }

    const existingSeancesForShow = await Seances.findAll({
        where: {
            Show_id: show_id
        }
    });

    const isNewShow = existingSeancesForShow.length === 0;

    const newSeance = await Seances.create({
        Theatre_id: theatre_id,
        Show_id: show_id,
        Start_time: startFormatted,
        End_time: endFormatted,
        Status: status
    });

    if (isNewShow) {
        const show = await Shows.findByPk(show_id);
        const th = await Theatres.findByPk(theatre_id);
        
        const message = `🎭 <b>Не пропустите премьеру!</b>\n\n` +
                       `📌 <b>${show.Title}</b>\n` +
                       `🕒 состоится: ${new Date(start_time).toLocaleString()}\n` +
                       `🏛 Театр: ${th.ThName}\n\n` +
                       `Успейте забронировать билет в AfishaApp!`;
        
        await telegramBot.sendBroadcastNotification(message);
    }

    return newSeance;
}

async updateSeance(seance_id, manager_user_id, theatre_id, show_id, start_time, end_time, status) {
    const manager = await Managers.findOne({
        where: {
            User_id: manager_user_id
        },
        rejectOnEmpty: true
    }).catch(() => {
        throw ApiError.BadRequest("Менеджер не найден");
    });

    if (Number(manager.Theatre_id) !== Number(theatre_id)) {
        throw ApiError.ForbiddenError();
    }

    const seance = await Seances.findByPk(seance_id, {
        include: [
            {
                model: Shows,
                as: 'Show',
                attributes: ['ID', 'Title']
            },
            {
                model: Theatres,
                attributes: ['ThName']
            }
        ]
    });
    if (!seance) {
        throw ApiError.BadRequest("Сеанс не найден");
    }

    // Сохраняем старые значения для сравнения
    const oldStartTime = seance.Start_time;
    const oldEndTime = seance.End_time;
    const oldShowId = seance.Show_id;
    const oldShowTitle = seance.Show.Title;

    const startMoment = moment(start_time).local();
    const endMoment = moment(end_time).local();
    const today = moment().startOf("day");

    // Проверка что время окончания позже времени начала
    if (endMoment.isSameOrBefore(startMoment)) {
        throw ApiError.BadRequest("Время окончания должно быть позже времени начала");
    }

    // Проверка минимальной длительности сеанса (1 час)
    if (endMoment.diff(startMoment, 'minutes') < 60) {
        throw ApiError.BadRequest("Минимальная длительность сеанса - 1 час.");
    }

    // Проверка что сеанс не в прошлом
    if (startMoment.isBefore(today)) {
        throw ApiError.BadRequest("Нельзя установить время сеанса в прошлом");
    }

    // Проверка что начало и конец в один день
    if (
        startMoment.year() !== endMoment.year() ||
        startMoment.month() !== endMoment.month() ||
        startMoment.date() !== endMoment.date()
    ) {
        throw ApiError.BadRequest("Дата начала и окончания сеанса должны быть в пределах одного дня.");
    }

    const startHour = startMoment.hour();
    const endHour = endMoment.hour();
    if ((startHour >= 23 || startHour < 7) || (endHour > 23 || endHour <= 7)) {
        throw ApiError.BadRequest("Сеансы нельзя ставить в ночное время (с 23:00 до 7:00).");
    }

    const startForDB = startMoment.format("YYYY-MM-DD HH:mm:ss");
    const endForDB = endMoment.format("YYYY-MM-DD HH:mm:ss");

    // Проверка пересечения с другими сеансами
    const conflictingSeance = await Seances.findOne({
        where: {
            Theatre_id: theatre_id,
            ID: { [Op.ne]: seance_id },
            [Op.or]: [
                {
                    Start_time: { [Op.lt]: endForDB },
                    End_time: { [Op.gt]: startForDB }
                },
                {
                    Start_time: { [Op.between]: [startForDB, endForDB] }
                },
                {
                    End_time: { [Op.between]: [startForDB, endForDB] }
                }
            ]
        }
    });

    if (conflictingSeance) {
        throw ApiError.BadRequest("Время сеанса пересекается с существующим сеансом");
    }

    await seance.update({
        Theatre_id: theatre_id,
        Show_id: show_id,
        Start_time: startForDB,
        End_time: endForDB,
        Status: status
    });

    // Получаем активные билеты один раз перед проверками
    const activeTickets = await Tickets.findAll({
        where: { 
            Seance_id: seance_id,
            Status: {
                [Op.iLike]: '%занято%' 
            }
        },
        attributes: ['User_id'],
        group: ['User_id'],
        raw: true
    });

    if (activeTickets.length > 0) {
        const userIds = activeTickets.map(t => t.User_id);
        
        // Проверяем изменилось ли время (сравниваем как строки)
        if (oldStartTime.toString() !== startForDB.toString()) {
            const seanceInfo = {
                showTitle: seance.Show.Title,
                theatreName: seance.Theatre.ThName,
                oldDate: moment(oldStartTime).format('DD.MM.YYYY'),
                oldTime: moment(oldStartTime).format('HH:mm'),
                newDate: moment(startForDB).format('DD.MM.YYYY'),
                newTime: moment(startForDB).format('HH:mm')
            };

            const sentCount = await telegramBot.sendRescheduleNotification(userIds, seanceInfo);
            console.log(`Уведомления о переносе отправлены ${sentCount} пользователям`);
        }
        
        // Проверяем изменилась ли постановка
        if (Number(oldShowId) !== Number(show_id)) {
            // Получаем новое название постановки
            const newShow = await Shows.findByPk(show_id);
            const newShowTitle = newShow ? newShow.Title : "Новая постановка";
            
            const changeInfo = {
                oldShowTitle: oldShowTitle,
                newShowTitle: newShowTitle,
                theatreName: seance.Theatre.ThName,
                date: moment(startForDB).format('DD.MM.YYYY'),
                time: moment(startForDB).format('HH:mm')
            };

            const sentCount = await telegramBot.sendShowChangeNotification(userIds, changeInfo);
            console.log(`Уведомления о замене постановки отправлены ${sentCount} пользователям`);
        }
    }

    return seance;
};

async cancelSeance(seance_id, manager_user_id) {
    try {
        const seance = await Seances.findByPk(seance_id, {
            include: [
                {
                    model: Shows,
                    attributes: ['Title']
                },
                {
                    model: Theatres,
                    attributes: ['ThName']
                }
            ],
            rejectOnEmpty: true
        }).catch(() => {
            throw ApiError.BadRequest(`Сеанс ${seance_id} не найден`);
        });

        const manager = await Managers.findOne({
            where: {
                User_id: manager_user_id
            },
            rejectOnEmpty: true
        }).catch(() => {
            throw ApiError.BadRequest("Менеджер не найден");
        });

        if (Number(manager.Theatre_id) !== Number(seance.Theatre_id)) {
            throw ApiError.ForbiddenError();
        }

        // Получаем список пользователей с активными билетами
        const activeTickets = await Tickets.findAll({
            where: { 
                Seance_id: seance_id,
                Status: {
                    [Op.iLike]: '%занято%' 
                }
            },
            include: [{
                model: Users,
                attributes: ['ID'],
                required: true
            }],
            raw: true
        });

        // Формируем список уникальных ID пользователей
        const userIds = [...new Set(activeTickets.map(t => t.User_id))];

        // Отменяем сеанс
        const canceledSeance = await seance.update({ Status: "Отменён" });

        // Отправляем уведомления в Telegram
        if (userIds.length > 0) {
            const seanceInfo = {
                showTitle: seance.Show.Title,
                theatreName: seance.Theatre.ThName,
                seanceDate: moment(seance.Start_time).format('DD.MM.YYYY'),
                seanceTime: moment(seance.Start_time).format('HH:mm')
            };

            const sentCount = await telegramBot.sendCancellationNotification(userIds, seanceInfo);
            console.log(`Уведомления об отмене отправлены ${sentCount} пользователям`);
        }

        return canceledSeance;
    } catch (error) {
        console.error('Error in cancelSeance:', error);
        throw error;
    }
}

async userHasTicketForSeance(userId, seanceId) {
  // Добавляем валидацию параметров
  if (isNaN(userId) || isNaN(seanceId)) {
    console.error('Invalid parameters:', { userId, seanceId });
    return false;
  }

  // Явное преобразование к числам
  const userIdNum = Number(userId);
  const seanceIdNum = Number(seanceId);

  // Проверка после преобразования
  if (isNaN(userIdNum)) {
    console.error('Invalid userId after conversion:', userId);
    return false;
  }

  if (isNaN(seanceIdNum)) {
    console.error('Invalid seanceId after conversion:', seanceId);
    return false;
  }

  try {
    const ticket = await Tickets.findOne({
      where: {
        User_id: userIdNum,
        Seance_id: seanceIdNum,
        Status: 'Активно',
        SeatStatus: 'Занято'
      },
      attributes: ['ID']
    });

    return !!ticket;
  } catch (error) {
    console.error('Database error in userHasTicketForSeance:', {
      userId,
      seanceId,
      error: error.message
    });
    return false;
  }
};

    async deleteSeance(id, manager_user_id){
        const seance = await Seances.findByPk(id);
        if(!seance){
            throw ApiError.BadRequest(`Сеанс ${id} не найден.`);
        }
        const manager = await Managers.findOne({
          where: {
              User_id: manager_user_id
          },
          rejectOnEmpty: true
      }).catch(() => {
          throw ApiError.BadRequest("Менеджер не найден");
      });
      
      
      if (Number(manager.Theatre_id) !== Number(seance.Theatre_id)) {
          throw ApiError.ForbiddenError();
      }

        await seance.destroy();
        return {message:'Сеанс удалён.'};
    }

    async getSeancesWithDetails() {
    const seances = await Seances.findAll({
        include: [
            {
                model: Shows,
                include: [
                    {
                        model: Theatres,
                        attributes: ['ID', 'ThName', 'ThCity', 'ThAddress']
                    },
                    {
                        model: Casts,
                        as: 'actors',
                        through: {
                            model: ShowCasts,
                            attributes: ['Role']
                        },
                        attributes: ['Cast_id', 'Name', 'Surname', 'Photo', 'Description', 'RoleType']
                    }
                ],
                attributes: [
                    'ID',
                    'Title', 
                    'Poster', 
                    'Genre', 
                    'Description', 
                    'StartPrice', 
                    'Rating',
                    'Duration', 
                    'PartsCount', 
                    'AgeRestriction'
                ]
            }
        ]
    });

    const formatted = seances.map(seance => {
        // Фильтруем каст по ролям
        const allCasts = seance.Show.actors || [];
        
        const actors = allCasts
            .filter(cast => cast.RoleType === 'actor')
            .map(actor => ({
                id: actor.Cast_id,
                name: actor.Name,
                surname: actor.Surname,
                role: actor.ShowCasts?.Role || 'Актёр',
                photo: actor.Photo,
                description: actor.Description,
                roleType: actor.RoleType
            }));

        const director = allCasts
            .find(cast => cast.RoleType === 'director');
        
        const playwright = allCasts
            .find(cast => cast.RoleType === 'playwright');

        return {
            id: seance.ID,
            startTime: seance.Start_time,
            endTime: seance.End_time,
            status: seance.Status,
            show: {
                id:seance.Show.ID,
                title: seance.Show.Title,
                poster: seance.Show.Poster,
                genre: seance.Show.Genre,
                description: seance.Show.Description,
                start_price: seance.Show.StartPrice,
                rating: seance.Show.Rating,
                duration_minutes: seance.Show.Duration, // Длительность в минутах
                parts_count: seance.Show.PartsCount, // Количество глав/актов
                age_restriction: seance.Show.AgeRestriction, // Возрастное ограничение
                theatre: {
                    id: seance.Show.Theatre?.ID,
                    name: seance.Show.Theatre?.ThName || "Неизвестно",
                    city: seance.Show.Theatre?.ThCity || "Неизвестно",
                    address: seance.Show.Theatre?.ThAddress || "Неизвестно"
                },
                cast: {
                    actors: actors, // Массив актёров
                    director: director ? {
                        id: director.Cast_id,
                        name: director.Name,
                        surname: director.Surname,
                        role: director.ShowCasts?.Role || 'Режиссёр',
                        photo: director.Photo,
                        description: director.Description
                    } : null,
                    playwright: playwright ? {
                        id: playwright.Cast_id,
                        name: playwright.Name,
                        surname: playwright.Surname,
                        role: playwright.ShowCasts?.Role || 'Драматург',
                        photo: playwright.Photo,
                        description: playwright.Description
                    } : null
                }
            }
        };
    });

    return formatted;
}

  async getSeancesByTheatre(theatreId) {
    const seances = await Seances.findAll({
        include: [
            {
                model: Shows,
                include: [
                    {
                        model: Theatres,
                        where: theatreId ? { ID: theatreId } : {},
                        attributes: ['ID', 'ThName', 'ThAddress'],
                        required: true
                    },
                    {
                        model: Casts,
                        as: 'actors',
                        through: { attributes: [] }, 
                        attributes: ['Cast_id', 'Name', 'Surname', 'Photo', 'Description']
                    }
                ],
                attributes: ['ID', 'Title', 'Poster', 'Genre', 'Description', 'StartPrice'],
                required: true 
            }
        ],
        order: [['Start_time', 'ASC']] // Сортировка по дате начала
    });

    const formatted = seances
        .filter(seance => seance.Show !== null) 
        .map(seance => ({
            id: seance.ID,
            startTime: seance.Start_time,
            endTime: seance.End_time,
            status: seance.Status,
            show: {
                id: seance.Show.ID,
                title: seance.Show.Title,
                poster: seance.Show.Poster,
                genre: seance.Show.Genre,
                description: seance.Show.Description,
                start_price: seance.Show.StartPrice,
                theatre: {
                    id: seance.Show.Theatre?.ID || null,
                    name: seance.Show.Theatre?.ThName || "Неизвестно",
                    address: seance.Show.Theatre?.ThAddress || "Неизвестно"
                },
                cast: seance.Show.actors.map(actor => ({
                    id: actor.Cast_id,
                    name: actor.Name,
                    surname: actor.Surname,
                    //role: actor.Role,
                    photo: actor.Photo,
                    description: actor.Description
                }))
            }
        }));
    
    return formatted;
};

    async getMaxPrice(seance_id){
        try {
            const seance = await Seances.findByPk(seance_id);
            if (!seance) throw new Error("Сеанс не найден");
            const show = await Shows.findByPk(seance.Show_id);
            if (!show) throw new Error("Шоу не найдено");
            const rows = await Rows.findAll({ where: { Theatre_id: seance.Theatre_id } });
            if (!rows.length) throw new Error("Ряды не найдены");
            const maxPriceMarkUp = Math.max(...rows.map(row => parseFloat(row.PriceMarkUp)));
            console.log(maxPriceMarkUp);
            return maxPriceMarkUp;
          } catch (error) {
            console.error("Ошибка в getMaxPrice:", error.message);
            throw error;
          }
    }

    
    async getMinPrice(seance_id){
      try {
          const seance = await Seances.findByPk(seance_id);
          if (!seance) throw new Error("Сеанс не найден");
          const show = await Shows.findByPk(seance.Show_id);
          if (!show) throw new Error("Шоу не найдено");
          const rows = await Rows.findAll({ where: { Theatre_id: seance.Theatre_id } });
          if (!rows.length) throw new Error("Ряды не найдены");
          const minPriceMarkUp = Math.min(...rows.map(row => parseFloat(row.PriceMarkUp)));
          console.log(minPriceMarkUp);
          return minPriceMarkUp;
        } catch (error) {
          console.error("Ошибка в getMaxPrice:", error.message);
          throw error;
        }
  }

   
async getTicket(seance_id, seat_id, user_id) {
    const transaction = await sequelize.transaction();
    
    try {
        const seance = await Seances.findByPk(seance_id, {
            lock: transaction.LOCK.UPDATE,
            transaction
        });

        if (!seance) {
            await transaction.rollback();
            throw ApiError.BadRequest(`Сеанс с ID ${seance_id} не найден.`);
        }

        if (seance.Status === 'Проведён') {
            await transaction.rollback();
            throw ApiError.BadRequest(`Сеанс ${seance_id} уже прошёл.`);
        }

        // Сначала проверяем место без блокировки
        const seat = await Seats.findByPk(seat_id, {
            include: [{
                model: Rows,
                as: 'Row'
            }],
            transaction
        });
        
        if (!seat) {
            await transaction.rollback();
            throw ApiError.BadRequest(`Место с ID ${seat_id} не найдено.`);
        }

        // Проверяем билет с блокировкой, но без JOIN
        const existingTicket = await Tickets.findOne({
            where: {
                Seance_id: seance_id,
                Seat_id: seat_id,
                Status: {
                    [Op.in]: ['Активно', 'Занято']
                }
            },
            lock: transaction.LOCK.UPDATE,
            transaction
        });

        if (existingTicket) {
            await transaction.rollback();
            // Получаем данные места и ряда для сообщения об ошибке
            throw ApiError.BadRequest(`Упс....Кто-то только что занял место ${seat.SeatNumber} в ряду ${seat.Row.RowNumber}, выберите другое.`);
        }

        const row = await Rows.findByPk(seat.Row_id, { transaction });
        const show = await Shows.findByPk(seance.Show_id, { transaction });

        const newTicket = await Tickets.create({
            User_id: user_id,
            Row_id: row.ID,
            Seat_id: seat_id,
            Seance_id: seance_id,
            Status: 'Занято',
            SeatStatus: 'Занято',
            Theatre_id: seance.Theatre_id,
            Total_price: Number(row.PriceMarkUp || 0) + Number(show.StartPrice || 0)
        }, { transaction });

        await transaction.commit();
        return newTicket;

    } catch (error) {
        if (transaction && !transaction.finished) {
            await transaction.rollback();
        }

        if (error instanceof ApiError) {
            throw error;
        }
        if (error.name === 'SequelizeUniqueConstraintError') {
            // Для случая UniqueConstraintError получаем данные места
            const seatWithRow = await Seats.findByPk(seat_id, {
                include: [{
                    model: Rows,
                    as: 'Row'
                }]
            });
            
            if (seatWithRow) {
                throw ApiError.BadRequest(`Упс....Кто-то только что занял место ${seatWithRow.SeatNumber} в ряду ${seatWithRow.Row.RowNumber}, выберите другое.`);
            } else {
                throw ApiError.BadRequest("Упс....Кто-то только что занял это место, выберите другое.");
            }
        }

        console.error('Ошибка бронирования:', error);
        throw ApiError.BadRequest("Произошла ошибка при бронировании. Пожалуйста, попробуйте еще раз.");
    }
};

async getStatus(seance_id){
    const bookedSeats = await Tickets.findAll({
        where: { 
          Seance_id: seance_id,
          SeatStatus: 'Занято'
        },
        attributes: ['Seat_id'], 
        raw: true
      });
      const bookedSeatIds = bookedSeats.map(seat => seat.Seat_id);
    return bookedSeatIds;
}

async getTicketsByClientId(clientId) {
    try {
      const tickets = await Tickets.findAll({
        where: { User_id: clientId },
        include: [
          {
            model: Seances,
            include: [
              {
                model: Shows,
                include: [
                  {
                    model: Theatres,
                    attributes: ['ID', 'ThName', 'ThAddress']
                  }
                ],
                attributes: ['ID', 'Title', 'Poster', 'Genre', 'Description', 'StartPrice']
              }
            ],
            attributes: ['ID', 'Start_time', 'End_time', 'Status']
          },
          {
            model: Rows,
            attributes: ['RowNumber', 'RowType'] 
          },
          {
            model: Seats,
            attributes: ['SeatNumber'] 
          }
        ],
        order: [['Seance_id', 'ASC']]
      });
  
      const formattedTickets = tickets.map(ticket => {
        const seance = ticket.Seance;
        const show = seance.Show;
        
        return {
          id: ticket.ID,
          startTime: seance.Start_time,
          endTime: seance.End_time,
          status: seance.Status,
          rowtype:ticket.Row.RowType, 
          rowNumber: ticket.Row.RowNumber,  
          seatNumber: ticket.Seat.SeatNumber, 
          show: {
            id: show.ID,
            title: show.Title,
            poster: show.Poster,
            genre: show.Genre,
            description: show.Description,
            start_price: show.StartPrice,
            theatre: {
              id: show.Theatre?.ID,
              name: show.Theatre?.ThName || "Неизвестно",
              address: show.Theatre?.ThAddress || "Неизвестно"
            }
          },
          ticketInfo: {
            id: ticket.ID,
            status: ticket.Status,
            totalPrice: ticket.Total_price,
            seatStatus: ticket.SeatStatus
          }
        };
      });
  
      return formattedTickets;
    } catch (error) {
      console.error('Error fetching client tickets:', error);
      throw error;
    }
  }

  async getTicketsWithDetails() {
    try {
      const tickets = await Tickets.findAll({
        attributes: ['ID', 'Status', 'Total_price', 'SeatStatus'],
        include: [
          {
            model: Users,
            attributes: ['ID','Name', 'Surname'],
            required: true
          },
          {
            model: Rows,
            attributes: ['RowNumber', 'RowType'],
            required: true
          },
          {
            model: Seats,
            attributes: ['SeatNumber'],
            required: true
          },
          {
            model: Seances,
            attributes: ['ID','Start_time', 'End_time'],
            required: true,
            include: [
              {
                model: Shows,
                attributes: ['Title'],
                required: true
              },
              {
                model: Theatres,
                attributes: ['ThName'],
                required: true
              }
            ]
          }
        ],
        order: [['ID', 'ASC']]
      });
  
      return tickets.map(ticket => {
        return {
          id: ticket.ID,
          status: ticket.Status,
          user: {
            id:ticket.User.ID,
            name: ticket.User.Name,
            surname: ticket.User.Surname
          },
          theatre: {
            name: ticket.Seance.Theatre.ThName
          },
          show: {
            title: ticket.Seance.Show.Title
          },
          row: {
            number: ticket.Row.RowNumber,
            type: ticket.Row.RowType
          },
          seat: {
            number: ticket.Seat.SeatNumber
          },
          seance: {
            id:ticket.Seance.ID,
            startTime: ticket.Seance.Start_time,
            endTime: ticket.Seance.End_time
          },
          ticketInfo: {
            totalPrice: ticket.Total_price,
            seatStatus: ticket.SeatStatus
          }
        };
      });
    } catch (error) {
      console.error('Error fetching tickets with details:', error);
      throw error;
    }
  };

async getTicketsWithDetailsByTh(theatreId) {
    try {
      const tickets = await Tickets.findAll({
        attributes: ['ID', 'Status', 'Total_price', 'SeatStatus'],
        include: [
          {
            model: Users,
            attributes: ['ID', 'Name', 'Surname'],
            required: true
          },
          {
            model: Rows,
            attributes: ['RowNumber', 'RowType'],
            required: true
          },
          {
            model: Seats,
            attributes: ['SeatNumber'],
            required: true
          },
          {
            model: Seances,
            attributes: ['ID', 'Start_time', 'End_time'],
            required: true,
            include: [
              {
                model: Shows,
                attributes: ['Title'],
                required: true
              },
              {
                model: Theatres,
                attributes: ['ID', 'ThName'],
                required: true,
                where: {
                  ID: theatreId  
                }
              }
            ]
          }
        ],
        order: [['ID', 'ASC']]
      });

      return tickets.map(ticket => {
        return {
          id: ticket.ID,
          status: ticket.Status,
          user: {
            id: ticket.User.ID,
            name: ticket.User.Name,
            surname: ticket.User.Surname
          },
          theatre: {
            id: ticket.Seance.Theatre.ID,  
            name: ticket.Seance.Theatre.ThName
          },
          show: {
            title: ticket.Seance.Show.Title
          },
          row: {
            number: ticket.Row.RowNumber,
            type: ticket.Row.RowType
          },
          seat: {
            number: ticket.Seat.SeatNumber
          },
          seance: {
            id: ticket.Seance.ID,
            startTime: ticket.Seance.Start_time,
            endTime: ticket.Seance.End_time
          },
          ticketInfo: {
            totalPrice: ticket.Total_price,
            seatStatus: ticket.SeatStatus
          }
        };
      });
    } catch (error) {
      console.error('Error fetching tickets with details:', error);
      throw error;
    }
  };

  async deleteTicket(id){
    const ticket = await Tickets.findByPk(id);
    if(!ticket){
        throw ApiError.BadRequest(`Билет ${id} не найден.`);
    }

    await ticket.destroy();
    return {message:'Билет удалён.'};
  }

  async getPersonalRecommendations(clientId) {
    try {
        // 1. Получаем все брони пользователя
        const tickets = await Tickets.findAll({
            where: { User_id: clientId },
            include: [
                {
                    model: Seances,
                    include: [
                        {
                            model: Shows,
                            attributes: ['Genre', 'ID']
                        }
                    ],
                    attributes: ['ID']
                }
            ]
        });

        // 2. Собираем уникальные жанры из его броней и 
        //    ID сеансов и шоу, которые уже есть у пользователя
        const userGenres = [];
        const userSeanceIds = []; // ID сеансов, которые уже есть у пользователя
        const userShowIds = new Set(); // ID шоу, которые пользователь уже смотрел
        
        tickets.forEach(ticket => {
            if (ticket.Seance?.Show?.Genre) {
                const genre = ticket.Seance.Show.Genre;
                if (!userGenres.includes(genre)) {
                    userGenres.push(genre);
                }
            }
            
            if (ticket.Seance?.ID) {
                userSeanceIds.push(ticket.Seance.ID);
            }
            
            if (ticket.Seance?.Show?.ID) {
                userShowIds.add(ticket.Seance.Show.ID);
            }
        });

        // 3. Если у пользователя нет броней или жанров, возвращаем пустой массив
        if (userGenres.length === 0) {
            return [];
        }

        // 4. Ищем ВСЕ сеансы с теми же жанрами (только будущие), 
        //    исключая уже купленные сеансы И сеансы тех же шоу
        const allRecommendedSeances = await Seances.findAll({
            where: {
                Status: 'Не проведён',
                Start_time: {
                    [Op.gt]: new Date() // только будущие сеансы
                },
                ID: {
                    [Op.notIn]: userSeanceIds // исключаем сеансы, которые уже есть у пользователя
                }
            },
            include: [
                {
                    model: Shows,
                    where: {
                        Genre: {
                            [Op.in]: userGenres // жанры из броней пользователя
                        },
                        ID: {
                            [Op.notIn]: Array.from(userShowIds) // исключаем шоу, которые пользователь уже смотрел
                        }
                    },
                    include: [
                        {
                            model: Theatres,
                            attributes: ['ID', 'ThName', 'ThAddress']
                        }
                    ],
                    attributes: ['ID', 'Title', 'Poster', 'Genre', 'Description', 'StartPrice']
                }
            ],
            order: [['Start_time', 'ASC']]
        });

        // 5. Группируем сеансы по шоу и выбираем ближайший для каждого
        const seancesByShow = {};
        
        allRecommendedSeances.forEach(seance => {
            const showId = seance.Show?.ID;
            
            if (!showId) return; // Пропускаем если нет шоу
            
            // Если это первое сеанс для данного шоу или этот сеанс ближе по времени
            if (!seancesByShow[showId] || 
                new Date(seance.Start_time) < new Date(seancesByShow[showId].Start_time)) {
                seancesByShow[showId] = seance;
            }
        });

        // 6. Преобразуем объект обратно в массив
        const uniqueSeances = Object.values(seancesByShow);

        // 7. Форматируем результат
        const formattedSeances = uniqueSeances.map(seance => {
            const show = seance.Show;
            
            return {
                seanceId: seance.ID,
                startTime: seance.Start_time,
                endTime: seance.End_time,
                status: seance.Status,
                show: {
                    id: show.ID,
                    title: show.Title,
                    poster: show.Poster,
                    genre: show.Genre,
                    description: show.Description,
                    start_price: show.StartPrice,
                    theatre: {
                        id: show.Theatre?.ID,
                        name: show.Theatre?.ThName || "Неизвестно",
                        address: show.Theatre?.ThAddress || "Неизвестно"
                    }
                }
            };
        });

        // 8. Сортируем по дате (ближайшие первыми)
        formattedSeances.sort((a, b) => {
            return new Date(a.startTime) - new Date(b.startTime);
        });

        // 9. Ограничиваем количество рекомендаций (например, 10)
        return formattedSeances.slice(0, 10);

    } catch (error) {
        console.error('Error getting personal recommendations:', error);
        throw error;
    }
}

async getPersonalRecommendationsByActors(clientId) {
    try {
        // 1. Получаем все брони пользователя с актерами
        const tickets = await Tickets.findAll({
            where: { User_id: clientId },
            include: [
                {
                    model: Seances,
                    include: [
                        {
                            model: Shows,
                            attributes: ['ID'],
                            include: [
                                {
                                    model: Casts,
                                    as: 'actors',
                                    through: { attributes: ['Role'] },
                                    where: {
                                        RoleType: 'actor' // Только актеры!
                                    },
                                    attributes: ['Cast_id', 'Name', 'Surname', 'RoleType']
                                }
                            ]
                        }
                    ],
                    attributes: ['ID']
                }
            ]
        });

        // 2. Собираем информацию об актерах (только актеры с RoleType = 'actor')
        const userActorMap = new Map(); // Map: actorId -> {actor, count, shows}
        const userSeanceIds = [];
        const userShowIds = new Set();
        
        tickets.forEach(ticket => {
            if (ticket.Seance?.ID) {
                userSeanceIds.push(ticket.Seance.ID);
            }
            
            if (ticket.Seance?.Show?.ID) {
                userShowIds.add(ticket.Seance.Show.ID);
            }
            
            // Собираем актеров из шоу (только тех, кто актеры)
            if (ticket.Seance?.Show?.actors) {
                ticket.Seance.Show.actors.forEach(actor => {
                    // Проверяем, что это актер (двойная проверка)
                    if (actor.RoleType === 'actor') {
                        if (!userActorMap.has(actor.Cast_id)) {
                            userActorMap.set(actor.Cast_id, {
                                id: actor.Cast_id,
                                name: actor.Name,
                                surname: actor.Surname,
                                roleType: actor.RoleType,
                                count: 0,
                                shows: new Set()
                            });
                        }
                        const actorData = userActorMap.get(actor.Cast_id);
                        actorData.count++;
                        actorData.shows.add(ticket.Seance.Show.ID);
                    }
                });
            }
        });

        // 3. Если у пользователя нет броней или актеров, возвращаем пустой массив
        if (userActorMap.size === 0) {
            return [];
        }

        const userActorIds = Array.from(userActorMap.keys());

        // 4. Ищем сеансы с теми же актерами (только актеры)
        const allRecommendedSeances = await Seances.findAll({
            where: {
                Status: 'Не проведён',
                Start_time: {
                    [Op.gt]: new Date()
                },
                ID: {
                    [Op.notIn]: userSeanceIds
                }
            },
            include: [
                {
                    model: Shows,
                    where: {
                        ID: {
                            [Op.notIn]: Array.from(userShowIds)
                        }
                    },
                    include: [
                        {
                            model: Theatres,
                            attributes: ['ID', 'ThName', 'ThAddress']
                        },
                        {
                            model: Casts,
                            as: 'actors',
                            where: {
                                Cast_id: {
                                    [Op.in]: userActorIds
                                },
                                RoleType: 'actor' // Только актеры в рекомендациях
                            },
                            attributes: ['Cast_id', 'Name', 'Surname', 'RoleType'],
                            through: { attributes: ['Role'] }
                        }
                    ],
                    attributes: ['ID', 'Title', 'Poster', 'Genre', 'Description', 'StartPrice']
                }
            ],
            order: [['Start_time', 'ASC']]
        });

        // 5. Фильтруем сеансы, где действительно есть общие актеры
        const filteredSeances = allRecommendedSeances.filter(seance => 
            seance.Show?.actors && seance.Show.actors.length > 0
        );

        // 6. Группируем по шоу и выбираем ближайший
        const seancesByShow = {};
        
        filteredSeances.forEach(seance => {
            const showId = seance.Show?.ID;
            if (!showId) return;
            
            if (!seancesByShow[showId] || 
                new Date(seance.Start_time) < new Date(seancesByShow[showId].Start_time)) {
                seancesByShow[showId] = seance;
            }
        });

        // 7. Форматируем результат
        const formattedSeances = Object.values(seancesByShow).map(seance => {
            const show = seance.Show;
            
            // Находим общих актеров (уже фильтруются как актеры)
            const commonActors = show.actors
                .filter(actor => userActorMap.has(actor.Cast_id))
                .map(actor => {
                    const userActorData = userActorMap.get(actor.Cast_id);
                    return {
                        id: actor.Cast_id,
                        name: actor.Name,
                        surname: actor.Surname,
                        fullName: `${actor.Name} ${actor.Surname}`,
                        roleType: actor.RoleType,
                        roleInShow: actor.ShowCasts?.Role || '',
                        watchedCount: userActorData.count,
                        watchedShows: Array.from(userActorData.shows)
                    };
                });
            
            // Релевантность на основе частоты актеров
            const relevanceScore = commonActors.reduce((score, actor) => 
                score + actor.watchedCount * 10, 0
            );
            
            return {
                seanceId: seance.ID,
                startTime: seance.Start_time,
                endTime: seance.End_time,
                status: seance.Status,
                show: {
                    id: show.ID,
                    title: show.Title,
                    poster: show.Poster,
                    genre: show.Genre,
                    description: show.Description,
                    start_price: show.StartPrice,
                    theatre: {
                        id: show.Theatre?.ID,
                        name: show.Theatre?.ThName || "Неизвестно",
                        address: show.Theatre?.ThAddress || "Неизвестно"
                    }
                },
                commonActors: commonActors,
                commonActorsCount: commonActors.length,
                relevanceScore: relevanceScore
            };
        });

        // 8. Сортируем по релевантности
        formattedSeances.sort((a, b) => {
            if (b.relevanceScore !== a.relevanceScore) {
                return b.relevanceScore - a.relevanceScore;
            }
            if (b.commonActorsCount !== a.commonActorsCount) {
                return b.commonActorsCount - a.commonActorsCount;
            }
            return new Date(a.startTime) - new Date(b.startTime);
        });

        // 9. Ограничиваем количество рекомендаций
        return formattedSeances.slice(0, 10);

    } catch (error) {
        console.error('Error getting personal recommendations by actors:', error);
        throw error;
    }
}

async getPersonalRecommendationsByPlaywrights(clientId) {
    try {
        // 1. Получаем все брони пользователя с актерами
        const tickets = await Tickets.findAll({
            where: { User_id: clientId },
            include: [
                {
                    model: Seances,
                    include: [
                        {
                            model: Shows,
                            attributes: ['ID'],
                            include: [
                                {
                                    model: Casts,
                                    as: 'actors',
                                    through: { attributes: ['Role'] },
                                    where: {
                                        RoleType: 'playwright' // Только актеры!
                                    },
                                    attributes: ['Cast_id', 'Name', 'Surname', 'RoleType']
                                }
                            ]
                        }
                    ],
                    attributes: ['ID']
                }
            ]
        });

        // 2. Собираем информацию об актерах (только актеры с RoleType = 'actor')
        const userActorMap = new Map(); // Map: actorId -> {actor, count, shows}
        const userSeanceIds = [];
        const userShowIds = new Set();
        
        tickets.forEach(ticket => {
            if (ticket.Seance?.ID) {
                userSeanceIds.push(ticket.Seance.ID);
            }
            
            if (ticket.Seance?.Show?.ID) {
                userShowIds.add(ticket.Seance.Show.ID);
            }
            
            // Собираем актеров из шоу (только тех, кто актеры)
            if (ticket.Seance?.Show?.actors) {
                ticket.Seance.Show.actors.forEach(actor => {
                    // Проверяем, что это актер (двойная проверка)
                    if (actor.RoleType === 'playwright') {
                        if (!userActorMap.has(actor.Cast_id)) {
                            userActorMap.set(actor.Cast_id, {
                                id: actor.Cast_id,
                                name: actor.Name,
                                surname: actor.Surname,
                                roleType: actor.RoleType,
                                count: 0,
                                shows: new Set()
                            });
                        }
                        const actorData = userActorMap.get(actor.Cast_id);
                        actorData.count++;
                        actorData.shows.add(ticket.Seance.Show.ID);
                    }
                });
            }
        });

        // 3. Если у пользователя нет броней или актеров, возвращаем пустой массив
        if (userActorMap.size === 0) {
            return [];
        }

        const userActorIds = Array.from(userActorMap.keys());

        // 4. Ищем сеансы с теми же актерами (только актеры)
        const allRecommendedSeances = await Seances.findAll({
            where: {
                Status: 'Не проведён',
                Start_time: {
                    [Op.gt]: new Date()
                },
                ID: {
                    [Op.notIn]: userSeanceIds
                }
            },
            include: [
                {
                    model: Shows,
                    where: {
                        ID: {
                            [Op.notIn]: Array.from(userShowIds)
                        }
                    },
                    include: [
                        {
                            model: Theatres,
                            attributes: ['ID', 'ThName', 'ThAddress']
                        },
                        {
                            model: Casts,
                            as: 'actors',
                            where: {
                                Cast_id: {
                                    [Op.in]: userActorIds
                                },
                                RoleType: 'playwright' // Только актеры в рекомендациях
                            },
                            attributes: ['Cast_id', 'Name', 'Surname', 'RoleType'],
                            through: { attributes: ['Role'] }
                        }
                    ],
                    attributes: ['ID', 'Title', 'Poster', 'Genre', 'Description', 'StartPrice']
                }
            ],
            order: [['Start_time', 'ASC']]
        });

        // 5. Фильтруем сеансы, где действительно есть общие актеры
        const filteredSeances = allRecommendedSeances.filter(seance => 
            seance.Show?.actors && seance.Show.actors.length > 0
        );

        // 6. Группируем по шоу и выбираем ближайший
        const seancesByShow = {};
        
        filteredSeances.forEach(seance => {
            const showId = seance.Show?.ID;
            if (!showId) return;
            
            if (!seancesByShow[showId] || 
                new Date(seance.Start_time) < new Date(seancesByShow[showId].Start_time)) {
                seancesByShow[showId] = seance;
            }
        });

        // 7. Форматируем результат
        const formattedSeances = Object.values(seancesByShow).map(seance => {
            const show = seance.Show;
            
            // Находим общих актеров (уже фильтруются как актеры)
            const commonActors = show.actors
                .filter(actor => userActorMap.has(actor.Cast_id))
                .map(actor => {
                    const userActorData = userActorMap.get(actor.Cast_id);
                    return {
                        id: actor.Cast_id,
                        name: actor.Name,
                        surname: actor.Surname,
                        fullName: `${actor.Name} ${actor.Surname}`,
                        roleType: actor.RoleType,
                        roleInShow: actor.ShowCasts?.Role || '',
                        watchedCount: userActorData.count,
                        watchedShows: Array.from(userActorData.shows)
                    };
                });
            
            // Релевантность на основе частоты актеров
            const relevanceScore = commonActors.reduce((score, actor) => 
                score + actor.watchedCount * 10, 0
            );
            
            return {
                seanceId: seance.ID,
                startTime: seance.Start_time,
                endTime: seance.End_time,
                status: seance.Status,
                show: {
                    id: show.ID,
                    title: show.Title,
                    poster: show.Poster,
                    genre: show.Genre,
                    description: show.Description,
                    start_price: show.StartPrice,
                    theatre: {
                        id: show.Theatre?.ID,
                        name: show.Theatre?.ThName || "Неизвестно",
                        address: show.Theatre?.ThAddress || "Неизвестно"
                    }
                },
                commonPlaywrights: commonActors,
                commonPlaywrightsCount: commonActors.length,
                relevanceScore: relevanceScore
            };
        });

        // 8. Сортируем по релевантности
        formattedSeances.sort((a, b) => {
            if (b.relevanceScore !== a.relevanceScore) {
                return b.relevanceScore - a.relevanceScore;
            }
            if (b.commonActorsCount !== a.commonActorsCount) {
                return b.commonActorsCount - a.commonActorsCount;
            }
            return new Date(a.startTime) - new Date(b.startTime);
        });

        // 9. Ограничиваем количество рекомендаций
        return formattedSeances.slice(0, 10);

    } catch (error) {
        console.error('Error getting personal recommendations by actors:', error);
        throw error;
    }
}

    
}
module.exports = new SeanceService();
const { where, fn, col } = require("sequelize");
const { Op } = require("sequelize"); 
const {Theatres, Rows, Seats,Users, TokenShemes, Managers, Casts, Shows, Show_Cast, Seance, Tickets, Ratings, ShowCasts} = require("../models/models.js");
const ApiError = require('../exceptions/apierror.js');
const fs = require('fs');
const path = require('path');
const FileService = require('./FileService.js');
const sequelize = require("../db.js");

class ShowService{

    async getShows(){
        const shows = await Shows.findAll();
        return shows;
    };
    async getShowsByManager(manager_user_id){
        const manager = await Managers.findOne({
            where: {
                User_id: manager_user_id
            },
            rejectOnEmpty: true
        }).catch(() => {
            throw ApiError.BadRequest("Менеджер не найден");
        });
        const theatreid = manager.Theatre_id;
        const shows = await Shows.findAll({where:{Theatre_id:theatreid}});
        return shows;
    };

    async getShowsWithDetailsById(showId) {
    try {
        const show = await Shows.findOne({
            where: { ID: showId },
            attributes: [
                'ID', 
                'Title', 
                'Genre', 
                'Description', 
                'Poster', 
                'Rating', 
                'Theatre_id', 
                'StartPrice',
                'Duration',         // Добавлено
                'PartsCount',       // Добавлено
                'AgeRestriction'    // Добавлено
            ],
            include: [
                {
                    model: Casts,
                    as: 'actors',
                    through: {
                        attributes: ['Role'],
                        as: 'showCastInfo'
                    },
                    attributes: [
                        'Cast_id', 
                        'Name', 
                        'Surname', 
                        'Photo', 
                        'Description'
                    ]
                },
                {
                    model: Theatres,
                    attributes: ['ID', 'ThName', 'ThAddress']
                }
            ]
        });

        if (!show) {
            throw new Error('Шоу с указанным ID не найдено');
        }

        // Форматируем результат
        const formattedShow = {
            id: show.ID,
            title: show.Title,
            genre: show.Genre,
            description: show.Description,
            poster: show.Poster,
            rating: show.Rating,
            theatre: {
                id: show.Theatre.ID,
                name: show.Theatre.ThName,
                address: show.Theatre.ThAddress
            },
            start_price: show.StartPrice,
            duration: show.Duration,         // Добавлено
            partsCount: show.PartsCount,     // Добавлено
            ageRestriction: show.AgeRestriction, // Добавлено
            actors: show.actors.map(actor => ({
                id: actor.Cast_id,
                name: actor.Name,
                surname: actor.Surname,
                photo: actor.Photo,
                description: actor.Description,
                role: actor.showCastInfo.Role
            }))
        };

        return formattedShow;
    } catch (error) {
        console.error('Ошибка при получении информации о шоу:', error);
        throw error;
    }
};

    async getShowsByTheatre(theatre_id){
        const shows = await Shows.findAll({where: { Theatre_id: theatre_id }});
        return shows;
    }

    async getShowById(id){
        const show = await Shows.findByPk(id);
        return show;
    }

    async addShow(
    manager_user_id, 
    title, 
    genre, 
    description, 
    rating, 
    theatreId, 
    poster, 
    start_price, 
    actorIds = [], 
    roles = [],
    duration = null,
    partsCount = 1,
    ageRestriction = null
) {
    // 1. Находим менеджера по User_id
    const manager = await Managers.findOne({
        where: {
            User_id: manager_user_id
        },
        rejectOnEmpty: true
    }).catch(() => {
        throw ApiError.BadRequest("Менеджер не найден");
    });

    console.log(theatreId);
    console.log(manager.Theatre_id);
    if (Number(manager.Theatre_id) !== Number(theatreId)) {
        throw ApiError.ForbiddenError();
    }

    // 3. Проверка уникальности названия постановки
    const existingShow = await Shows.findOne({
        where: {
           Title: {
                [Op.eq]: title.trim() 
            },
        }
    });

    if (existingShow) {
        throw ApiError.BadRequest("Постановка с таким названием уже существует!");
    }

    if (!poster) {
        throw ApiError.BadRequest("Файл постера обязателен!");
    }
    
    const validActorIds = actorIds
        .map(id => Number(id)) 
        .filter(id => !isNaN(id));

    if (actorIds.length !== validActorIds.length) {
        throw ApiError.BadRequest("Некорректные ID актеров");
    }

    const remoteFileName = `${Date.now()}_${title}.jpg`;
    const filePath = poster.path;
    const posterUrl = await FileService.uploadFile(filePath, remoteFileName);

    // 4. Создаем постановку со всеми полями
    const show = await Shows.create({
        Title: title,
        Genre: genre,
        Description: description,
        Rating: rating,
        Theatre_id: theatreId,
        Poster: posterUrl,
        StartPrice: start_price,
        CreatedBy: manager.ID, // Сохраняем ID менеджера, который создал постановку
        Duration: duration,
        PartsCount: partsCount,
        AgeRestriction: ageRestriction
    });

    if (validActorIds.length > 0) {
        if (validActorIds.length !== roles.length) {
            throw ApiError.BadRequest("Количество ролей должно соответствовать количеству актеров");
        }

        const existingActors = await Casts.findAll({
            where: {
                Cast_id: validActorIds
            }
        });

        if (existingActors.length !== validActorIds.length) {
            throw ApiError.BadRequest("Один или несколько актеров не найдены");
        }

        const showCastRecords = validActorIds.map((actorId, index) => ({
            Show_id: show.ID,
            Cast_id: actorId,
            Role: roles[index] || ''
        }));

        await ShowCasts.bulkCreate(showCastRecords);
    }

    return show;
}
    async deleteShow(id, manager_user_id) {
        const manager = await Managers.findOne({
            where: {
                User_id: manager_user_id
            },
            rejectOnEmpty: true
        }).catch(() => {
            throw ApiError.BadRequest("Менеджер не найден");
        });

        const show = await Shows.findByPk(id);
        if (!show) {
            throw ApiError.BadRequest(`Постановка с ID ${id} не найдена`);
        }
        if (Number(manager.Theatre_id) !== Number(show.Theatre_id)) {
            throw ApiError.ForbiddenError();
        }
        await show.destroy();
        return { message: `Постановка ${show.Title} удалена` };
    }

    async updateShow(
    id,
    manager_user_id, 
    title, 
    genre, 
    description, 
    theatreId, 
    poster, 
    start_price, 
    actorIds = [], 
    roles = [],
    duration = null,
    partsCount = null,
    ageRestriction = null
) {
    try {
        const manager = await Managers.findOne({
            where: {
                User_id: manager_user_id
            },
            rejectOnEmpty: true
        }).catch(() => {
            throw ApiError.BadRequest("Менеджер не найден");
        });
    
        console.log(theatreId);
        console.log(manager.Theatre_id);
        if (Number(manager.Theatre_id) !== Number(theatreId)) {
            throw ApiError.ForbiddenError();
        }

        const show = await Shows.findByPk(id);
        if (!show) {
            throw ApiError.BadRequest("Постановка с указанным ID не найдена");
        }

        const existingShow = await Shows.findOne({
            where: {
                Title: {
                    [Op.eq]: title.trim() 
                },
                ID: {
                    [Op.ne]: id 
                }
            }
        });

        if (existingShow) {
            throw ApiError.BadRequest("Постановка с таким названием уже существует!");
        }

        const validActorIds = actorIds
            .map(id => Number(id))
            .filter(id => !isNaN(id));

        if (actorIds.length !== validActorIds.length) {
            throw ApiError.BadRequest("Некорректные ID актеров");
        }
        if (actorIds.length == 0) {
            throw ApiError.BadRequest("В постановке должен быть хотя бы один актёр");
        }

        // Валидация duration
        if (duration !== null && (typeof duration !== 'number' || duration <= 0)) {
            throw ApiError.BadRequest("Длительность должна быть положительным числом (в минутах)");
        }

        // Валидация partsCount
        if (partsCount !== null && (typeof partsCount !== 'number' || partsCount < 1)) {
            throw ApiError.BadRequest("Количество частей должно быть положительным числом");
        }

        // Валидация ageRestriction
        if (ageRestriction !== null && !/^\d{1,2}\+$/.test(ageRestriction)) {
            throw ApiError.BadRequest("Возрастное ограничение должно быть в формате '12+', '16+', '18+' и т.д.");
        }

        // Обновляем постер если он был изменен
        let posterUrl = show.Poster;
        if (poster) {
            const filePath = poster.path;
            const oldFileName = show.Poster.split("/").pop();
            posterUrl = await FileService.uploadFile(filePath, oldFileName);
        }

        // Обновляем основные данные постановки с новыми полями
        await show.update({
            Title: title || show.Title,
            Genre: genre || show.Genre,
            Description: description || show.Description,
            Theatre_id: theatreId || show.Theatre_id,
            Poster: posterUrl,
            StartPrice: start_price || show.StartPrice,
            Duration: duration !== null ? duration : show.Duration,
            PartsCount: partsCount !== null ? partsCount : show.PartsCount,
            AgeRestriction: ageRestriction !== null ? ageRestriction : show.AgeRestriction
        });

        // Удаляем все текущие связи с актерами
        await ShowCasts.destroy({
            where: { Show_id: id },
        });

        // Если переданы актеры, создаем новые связи
        if (validActorIds.length > 0) {
            if (validActorIds.length !== roles.length) {
                throw ApiError.BadRequest("Количество ролей должно соответствовать количеству актеров");
            }

            // Проверяем существование актеров
            const existingActors = await Casts.findAll({
                where: {
                    Cast_id: validActorIds
                }
            });

            if (existingActors.length !== validActorIds.length) {
                throw ApiError.BadRequest("Один или несколько актеров не найдены");
            }

            // Создаем новые записи для ShowCasts
            const showCastRecords = validActorIds.map((actorId, index) => ({
                Show_id: id,
                Cast_id: actorId,
                Role: roles[index] || ''
            }));

            await ShowCasts.bulkCreate(showCastRecords);
        }

        return show;
    } catch (error) {
        throw error;
    }
}

 async getShowDuration(showId) {
    try {
        const show = await Shows.findOne({
            where: { ID: showId },
            attributes: ['ID', 'Duration'] 
        });

        if (!show) {
            throw new Error('Шоу с указанным ID не найдено');
        }

        return show.Duration; 
    } catch (error) {
        console.error('Ошибка при получении длительности шоу:', error);
        throw error;
    }
}
      
    //-----------------------------------------------------------------------------
 async addCast(name, surname, photo, description, theatre_id, roleType) {
    if (!photo) {
        throw new ApiError.BadRequest("Фото актёра обязательно!");
    }

    // Проверяем существование театра
    const theatre = await Theatres.findByPk(theatre_id);
    if (!theatre) {
        throw new ApiError.BadRequest(`Театр с ID ${theatre_id} не найден`);
    }

    // Проверяем корректность roleType
    const validRoleTypes = ['actor', 'director', 'playwright'];
    if (roleType && !validRoleTypes.includes(roleType)) {
        throw new ApiError.BadRequest(`Некорректный тип роли. Допустимые значения: ${validRoleTypes.join(', ')}`);
    }

    const remoteFileName = `${Date.now()}_${name}_${surname}.jpg`;
    const filePath = photo.path;
    const posterUrl = await FileService.uploadFileActor(filePath, remoteFileName);
    
    const cast = await Casts.create({
        Name: name,
        Surname: surname,
        Photo: posterUrl,
        Description: description,
        Theatre_id: theatre_id,
        RoleType: roleType || 'actor' 
    });
    return cast;
}

    async updateCast(id, name, surname, photo, description, show_id) {
        const cast = await Casts.findByPk(id);
        if (!cast) {
            throw ApiError.BadRequest("Актёр с указанным ID не найден");
        }
        if (show_id) {
            const show = await Shows.findByPk(show_id);
            if (!show) {
                throw ApiError.BadRequest(`Постановка с ID ${show_id} не найдена`);
            }
        }
        if (photo) {
            const filePath = path.join(__dirname, '..', photo);
            if (!fs.existsSync(filePath)) {
                throw ApiError.BadRequest(`Файл ${photo} не найден`);
            }
        }
        await cast.update({
            Name: name || cast.Name,
            Surname: surname || cast.Surname,
            Photo: photo || cast.Photo,
            Description: description || cast.Description,
            Show_id: show_id || cast.Show_id
        });
        return cast;
    }

    async deleteCast(id){
        const cast = await Casts.findByPk(id);
        if (!cast) {
            throw ApiError.BadRequest(`Актёр с ID ${id} не найден`);
        }
        await cast.destroy();
        return { message: `Актёр ${cast.Name} удален` };
    };

async getCast(actorId = null) {
  try {
    if (actorId) {
      const actor = await Casts.findByPk(actorId, {
        include: [
          {
            model: Shows,
            as: 'shows',
            through: { attributes: ['Role'] },
            attributes: ['ID', 'Title', 'Genre', 'Poster']
          },
          {
            model: Theatres,
            attributes: ['ID', 'ThName', 'ThCity', 'ThAddress', 'ThPhone']
          }
        ],
        attributes: ['Cast_id', 'Name', 'Surname', 'Description', 'Photo', 'RoleType', 'Theatre_id']
      });

      if (!actor) {
        throw new Error('Актер не найден');
      }

      // Форматируем значение роли
      const roleTypeMap = {
        'actor': 'Актёр',
        'director': 'Художественный Руководитель',
        'playwright': 'Драматург',
        'other': 'Другое'
      };
      
      const roleTypeText = roleTypeMap[actor.RoleType] || actor.RoleType;

      return {
        id: actor.Cast_id,
        name: actor.Name,
        surname: actor.Surname,
        description: actor.Description,
        photo: actor.Photo,
        roleType: actor.RoleType,
        roleTypeText: roleTypeText,
        theatre_id: actor.Theatre_id,
        theatre: actor.Theatre ? {
          id: actor.Theatre.ID,
          name: actor.Theatre.ThName,
          city: actor.Theatre.ThCity,
          address: actor.Theatre.ThAddress,
          phone: actor.Theatre.ThPhone
        } : null,
        shows: actor.shows.map(show => ({
          id: show.ID,
          title: show.Title,
          genre: show.Genre,
          poster: show.Poster,
          role: show.ShowCasts.Role 
        }))
      };
    }
    
    // Получаем всех актеров с информацией о театре
    const allActors = await Casts.findAll({
      include: [
        {
          model: Theatres,
          attributes: ['ID', 'ThName', 'ThCity']
        }
      ],
      attributes: ['Cast_id', 'Name', 'Surname', 'Description', 'Photo', 'RoleType', 'Theatre_id']
    });
    
    // Форматируем результат для всех актеров
    const formattedActors = allActors.map(actor => {
      const roleTypeMap = {
        'actor': 'Актёр',
        'director': 'Художественный Руководитель',
        'playwright': 'Режиссёр',
        'other': 'Другое'
      };
      
      const roleTypeText = roleTypeMap[actor.RoleType] || actor.RoleType;

      return {
        Cast_id: actor.Cast_id,
        Name: actor.Name,
        Surname: actor.Surname,
        Description: actor.Description,
        Photo: actor.Photo,
        RoleType: actor.RoleType,
        RoleTypeText: roleTypeText,
        Theatre_id: actor.Theatre_id,
        Theatre: actor.Theatre ? {
          ID: actor.Theatre.ID,
          ThName: actor.Theatre.ThName,
          ThCity: actor.Theatre.ThCity
        } : null
      };
    });
    
    return formattedActors;
  } catch (error) {
    console.error('Error fetching cast:', error);
    throw error;
  }
}

async getActors(actorId = null) {
  try {
    if (actorId) {
      // Получаем конкретного актера с проверкой roletype
      const actor = await Casts.findOne({
        where: {
          Cast_id: actorId,
          RoleType: 'actor' // Проверяем, что это именно актер
        },
        include: [
          {
            model: Shows,
            as: 'shows',
            through: { attributes: ['Role'] },
            attributes: ['ID', 'Title', 'Genre', 'Poster']
          },
          {
            model: Theatres,
            attributes: ['ID', 'ThName', 'ThCity', 'ThAddress', 'ThPhone']
          }
        ],
        attributes: ['Cast_id', 'Name', 'Surname', 'Description', 'Photo', 'RoleType', 'Theatre_id']
      });

      if (!actor) {
        throw new Error('Актер не найден');
      }

      // Форматируем результат
      return {
        id: actor.Cast_id,
        name: actor.Name,
        surname: actor.Surname,
        description: actor.Description,
        photo: actor.Photo,
        roleType: actor.RoleType,
        roleTypeText: 'Актёр', // Для актера всегда "Актёр"
        theatre_id: actor.Theatre_id,
        theatre: actor.Theatre ? {
          id: actor.Theatre.ID,
          name: actor.Theatre.ThName,
          city: actor.Theatre.ThCity,
          address: actor.Theatre.ThAddress,
          phone: actor.Theatre.ThPhone
        } : null,
        shows: actor.shows.map(show => ({
          id: show.ID,
          title: show.Title,
          genre: show.Genre,
          poster: show.Poster,
          role: show.ShowCasts.Role 
        }))
      };
    }
    
    // Получаем всех актеров (только с RoleType = 'actor') с информацией о театре
    const allActors = await Casts.findAll({
      where: {
        RoleType: 'actor' // Только актеры
      },
      include: [
        {
          model: Theatres,
          attributes: ['ID', 'ThName', 'ThCity']
        }
      ],
      attributes: ['Cast_id', 'Name', 'Surname', 'Description', 'Photo', 'RoleType', 'Theatre_id']
    });
    
    // Форматируем результат для всех актеров
    const formattedActors = allActors.map(actor => {
      return {
        Cast_id: actor.Cast_id,
        Name: actor.Name,
        Surname: actor.Surname,
        Description: actor.Description,
        Photo: actor.Photo,
        RoleType: actor.RoleType,
        RoleTypeText: 'Актёр', // Для актера всегда "Актёр"
        Theatre_id: actor.Theatre_id,
        Theatre: actor.Theatre ? {
          ID: actor.Theatre.ID,
          ThName: actor.Theatre.ThName,
          ThCity: actor.Theatre.ThCity
        } : null
      };
    });
    
    return formattedActors;
  } catch (error) {
    console.error('Error fetching actors:', error);
    throw error;
  }
}

async getPlaywrights(actorId = null) {
  try {
    if (actorId) {
      // Получаем конкретного актера с проверкой roletype
      const actor = await Casts.findOne({
        where: {
          Cast_id: actorId,
          RoleType: 'playwright' 
        },
        include: [
          {
            model: Shows,
            as: 'shows',
            through: { attributes: ['Role'] },
            attributes: ['ID', 'Title', 'Genre', 'Poster']
          },
          {
            model: Theatres,
            attributes: ['ID', 'ThName', 'ThCity', 'ThAddress', 'ThPhone']
          }
        ],
        attributes: ['Cast_id', 'Name', 'Surname', 'Description', 'Photo', 'RoleType', 'Theatre_id']
      });

      if (!actor) {
        throw new Error('Актер не найден');
      }

      // Форматируем результат
      return {
        id: actor.Cast_id,
        name: actor.Name,
        surname: actor.Surname,
        description: actor.Description,
        photo: actor.Photo,
        roleType: actor.RoleType,
        roleTypeText: 'Режиссёр', 
        theatre_id: actor.Theatre_id,
        theatre: actor.Theatre ? {
          id: actor.Theatre.ID,
          name: actor.Theatre.ThName,
          city: actor.Theatre.ThCity,
          address: actor.Theatre.ThAddress,
          phone: actor.Theatre.ThPhone
        } : null,
        shows: actor.shows.map(show => ({
          id: show.ID,
          title: show.Title,
          genre: show.Genre,
          poster: show.Poster,
          role: show.ShowCasts.Role 
        }))
      };
    }
   
    const allActors = await Casts.findAll({
      where: {
        RoleType: 'playwright' 
      },
      include: [
        {
          model: Theatres,
          attributes: ['ID', 'ThName', 'ThCity']
        }
      ],
      attributes: ['Cast_id', 'Name', 'Surname', 'Description', 'Photo', 'RoleType', 'Theatre_id']
    });
    
    // Форматируем результат для всех актеров
    const formattedActors = allActors.map(actor => {
      return {
        Cast_id: actor.Cast_id,
        Name: actor.Name,
        Surname: actor.Surname,
        Description: actor.Description,
        Photo: actor.Photo,
        RoleType: actor.RoleType,
        RoleTypeText: 'Режиссёр', 
        Theatre_id: actor.Theatre_id,
        Theatre: actor.Theatre ? {
          ID: actor.Theatre.ID,
          ThName: actor.Theatre.ThName,
          ThCity: actor.Theatre.ThCity
        } : null
      };
    });
    
    return formattedActors;
  } catch (error) {
    console.error('Error fetching actors:', error);
    throw error;
  }
}

    async  getShowsByActorId(actorId) {
      try {
          const actorWithShows = await Casts.findByPk(actorId, {
              include: [{
                  model: Shows,
                  as: 'shows',
                  through: {
                      attributes: ['Role'] 
                  },
                  attributes: ['ID', 'Title', 'Genre', 'Description', 'Poster', 'Rating', 'StartPrice']
              }]
          });
  
          if (!actorWithShows) {
              throw new Error('Актер не найден');
          }
  
          return actorWithShows.shows;
      } catch (error) {
          console.error('Ошибка при получении спектаклей актера:', error);
          throw error;
      }
  }

    async  rateShow(userId, showId, userRating) {
      try {
        if (userRating < 1 || userRating > 10) {
          throw new ApiError('Рейтинг должен быть числом от 1 до 10');
        }
  
        const existingRating = await Ratings.findOne({
          where: { UserId: userId, ShowId: showId }
        });
    
        if (existingRating) {
          throw new ApiError('Вы уже оценили это шоу');
        }
    
        await Ratings.create({
          UserId: userId,
          ShowId: showId,
          RatingValue: userRating
        });
        const ratings = await Ratings.findAll({
          where: { ShowId: showId },
          attributes: [[sequelize.fn('AVG', sequelize.col('RatingValue')), 'avgRating']]
        });
    
        const newAverageRating = parseFloat(ratings[0].dataValues.avgRating).toFixed(2);
        await Shows.update(
          { Rating: newAverageRating },
          { where: { ID: showId }}
        );
        
        return {
          success: true,
          message: 'Рейтинг успешно добавлен',
          newRating: newAverageRating
        };
      } catch (error) {
        console.error('Ошибка при обновлении рейтинга:', error);
        return {
          success: false,
          message: error.message || 'Произошла ошибка при обновлении рейтинга'
        };
      }
    }

    async checkUserRating(userId, showId){
      const existingRating = await Ratings.findOne({
        where: { UserId: userId, ShowId: showId }
      });
      if (existingRating){
        return true;
      }
      return false;
    };
}
module.exports = new ShowService();
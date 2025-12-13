const { where } = require("sequelize");
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');
const {Theatres, Rows, Seats,Users, TokenShemes, Managers, Cast, Shows, Show_Cast, Seance, Ticket, Comments} = require("../models/models.js");
const MailService = require('./MailService.js');
const TokenService = require('./TokenService.js')
const UserDto = require('../dto/UserDto.js')
const ApiError = require('../exceptions/apierror.js')
const sequelize = require("../db.js");
const { Op } = require('sequelize'); 

class UserService {
    async registration (email, password, name, surname){
        const candidate = await Users.findOne({ where: { Email: email } });
        if(candidate){
            throw ApiError.BadRequest(`Пользователь с email ${email} уже существует, выберите другой email.`);
        }
         if (!password || password.length <= 5) {
        throw ApiError.BadRequest('Пароль должен содержать более 5 символов.');
    }

        const hashpass = await bcrypt.hash(password, 4);

        const user = await Users.create({ Email: email, Password: hashpass, Name: name, Surname: surname, Role:'client' });
        // console.log(`${process.env.API_URL}/api/activate/${activationLink}`);
        // await MailService.sendActivationMail(email, `${process.env.API_URL}/api/activate/${activationLink}`);
        const userDto = new UserDto(user);
        const tokens = TokenService.generateToken({...userDto});
        await TokenService.saveToken(userDto.id, tokens.refreshToken);
        
        return{...tokens, user:userDto}
    }

    // async activate(activationLink){
    //     const user = await Users.findOne({where:{ActivationLink: activationLink}})
    //     if(!user){
    //         throw ApiError.BadRequest('Неккоректная ссылка активация')
    //     }
    //     user.isActive = true;
    //     await user.save();
    // }
    
    async login(email, password, userAgent = '', ip = ''){
        try{
        const user = await Users.findOne({where:{Email: email}});
        if(!user){
            throw ApiError.BadRequest(`Пользователь с email ${email} не найден.`);
        }
      
        const isPassEquals = await bcrypt.compare(password, user.Password);
        if(!isPassEquals){
            throw ApiError.BadRequest(`Неверный пароль.`);
        } 
        const userDto = new UserDto(user);
        const tokens = TokenService.generateToken({...userDto});
       await TokenService.saveToken(userDto.id, tokens.refreshToken, userAgent, ip);
        return{...tokens, user:userDto}
    }catch (err) {
        throw err;
    }
    }

    async logout(refreshToken){
        const token = await TokenService.removeToken(refreshToken);
        return token;
    }

    async refresh(refreshToken, userAgent = '', ip = ''){
        if(!refreshToken){
            throw ApiError.UnautorizedError();
        }
        const userData = TokenService.validateRefreshToken(refreshToken);
        const tokenFromDb = await TokenService.findToken(refreshToken);
        if(!userData || !tokenFromDb){
            throw ApiError.UnautorizedError()
        }
        const user = await Users.findByPk(userData.id)
        const userDto = new UserDto(user);
        const tokens = TokenService.generateToken({...userDto});
        console.log(tokens.accesToken);
        await TokenService.saveToken(userDto.id, tokens.refreshToken, userAgent, ip);
        return{...tokens, user:userDto}
    }

    async getAllUsers(){
        const users = await Users.findAll();
        return users;
    }
    async getClients(){
        const role = 'client';
        const clients = await Users.findAll({where:{Role:role}});
        return clients;
    };

    async getUser(id){
        const user = await Users.findByPk(id);
        return user;
    }

    async updateUser(userId, password, name, surname ) {
        
            const user = await Users.findByPk(userId);
            if (!user) {
                throw ApiError.BadRequest(`Пользователь с ID ${userId} не найден.`);
            }
            // if (password && password.length < 5) {
            //          throw ApiError.BadRequest('Пароль должен содержать более 5 символов.');
            //     }

            if (password && typeof password === "string" && password.trim() !== "") {
                user.Password = await bcrypt.hash(password, 3);
            }
            if (name) user.Name = name;
            if (surname) user.Surname = surname;
    
            await user.save();
            
            return { 
                message: `Пользователь с ID ${userId} успешно обновлён.`,
                user: {
                    ID: user.ID,
                    Name: user.Name,
                    Surname: user.Surname,
                    isActive: user.isActive,
                    Role: user.Role
                }
            };
        };
    
        async verifyCurrentPassword(userId, currentPassword) {
           
                const user = await Users.findByPk(userId);
                if (!user) {
                    throw new Error('Пользователь не найден');
                }
    
                const isMatch = await bcrypt.compare(currentPassword, user.Password);
                
                return isMatch; 
            
        }
        
   
async createShowComment(userId, showId, content, rating = null) {
    try {
        const comment = await Comments.create({
            User_id: userId,
            Show_id: showId,
            Content: content,
            Rating: rating,
            Status: 'active'
        });
        
        return { success: true, data: comment };
    } catch (error) {
        console.error('Ошибка при создании комментария:', error);
        return { success: false, error: error.message };
    }
}

// Метод для ответа на комментарий
async replyToComment(userId, parentCommentId, content) {
    try {
        // Проверяем, существует ли родительский комментарий
        const parentComment = await Comments.findByPk(parentCommentId);
        if (!parentComment) {
            return { success: false, error: 'Родительский комментарий не найден' };
        }
        
        const reply = await Comments.create({
            User_id: userId,
            Show_id: parentComment.Show_id, // Ответ относится к тому же спектаклю
            Content: content,
            ParentComment_id: parentCommentId,
            Status: 'active'
        });
        
        return { success: true, data: reply };
    } catch (error) {
        console.error('Ошибка при создании ответа:', error);
        return { success: false, error: error.message };
    }
}

// Метод для получения комментариев к спектаклю с ответами
async getShowComments(showId) {
    try {
        console.log('Получаем комментарии для showId:', showId);
        
        // Получаем все комментарии для данного шоу
        const comments = await Comments.findAll({
            where: { 
                Show_id: showId
            },
            include: [
                {
                    model: Users,
                    attributes: ['ID', 'Name', 'Surname'], // Исправлено на 'Surname'
                    required: false // LEFT JOIN чтобы получить и удалённые комментарии
                },
                {
                    model: Comments,
                    as: 'Replies',
                    include: [{
                        model: Users,
                        attributes: ['ID', 'Name', 'Surname'],
                        required: false
                    }],
                    required: false
                }
            ],
            order: [
                ['CreatedAt', 'DESC'], // Сначала новые комментарии
                [{ model: Comments, as: 'Replies' }, 'CreatedAt', 'ASC'] // Ответы по порядку
            ]
        });

        console.log('Найдено комментариев:', comments.length);
        
        // Преобразуем в простой объект
        const formattedComments = comments.map(comment => {
            const commentData = comment.get({ plain: true });
            
            // Обрабатываем удалённые комментарии
            if (commentData.Status === 'deleted') {
                commentData.Content = '[Комментарий удалён]';
                commentData.Rating = null;
                // Скрываем информацию о пользователе для удалённых комментариев
                commentData.User = { 
                    ID: null, 
                    Name: 'Удалённый', 
                    Surname: 'пользователь'
                };
                // Убираем возможность отвечать на удалённые комментарии
                if (commentData.Replies && commentData.Replies.length > 0) {
                    commentData.Replies = commentData.Replies.map(reply => {
                        // Для ответов на удалённые комментарии тоже скрываем автора если ответ удалён
                        if (reply.Status === 'deleted') {
                            reply.Content = '[Комментарий удалён]';
                            reply.Rating = null;
                            reply.User = { 
                                ID: null, 
                                Name: 'Удалённый', 
                                Surname: 'пользователь'
                            };
                        }
                        return reply;
                    });
                }
            }
            
            return commentData;
        });

        // Разделяем на корневые комментарии и ответы
        const rootComments = formattedComments.filter(comment => !comment.ParentComment_id);
        const replies = formattedComments.filter(comment => comment.ParentComment_id);
        
        console.log('Корневых комментариев:', rootComments.length);
        console.log('Ответов:', replies.length);
        
        return { 
            success: true, 
            data: rootComments,
            count: rootComments.length + replies.length
        };
    } catch (error) {
        console.error('Ошибка при получении комментариев:', error);
        return { 
            success: false, 
            error: error.message 
        };
    }
}

// Метод для редактирования комментария
async updateComment(commentId, userId, content) {
    try {
        const comment = await Comments.findOne({
            where: { ID: commentId, User_id: userId }
        });
        
        if (!comment) {
            return { success: false, error: 'Комментарий не найден или нет прав' };
        }
        
        await comment.update({
            Content: content,
            UpdatedAt: new Date()
        });
        
        return { success: true, data: comment };
    } catch (error) {
        console.error('Ошибка при редактировании комментария:', error);
        return { success: false, error: error.message };
    }
}

// Метод для удаления комментария
async deleteComment(userId, commentId) {
    try {
        const comment = await Comments.findOne({
            where: { 
                ID: commentId, 
                User_id: userId,
                Status: { [Op.ne]: 'deleted' }
            }
        });
        
        if (!comment) {
            return { 
                success: false, 
                error: 'Комментарий не найден или нет прав для удаления' 
            };
        }
        
        // ВСЕГДА помечаем как удалённый вместо физического удаления
        await comment.update({ 
            Status: 'deleted',
            Content: '[Комментарий удалён]',
            Rating: null,
            User_id: null // Убираем ссылку на пользователя
        });
        
        console.log(`Комментарий ${commentId} помечен как удалённый`);
        
        return { 
            success: true, 
            message: 'Комментарий помечен как удалённый',
            data: comment 
        };
    } catch (error) {
        console.error('Ошибка при удалении комментария:', error);
        return { 
            success: false, 
            error: error.message 
        };
    }
}

// Метод для получения статистики по комментариям
async getCommentsStats(showId) {
    try {
        const stats = await Comments.findOne({
            where: { Show_id: showId },
            attributes: [
                [sequelize.fn('COUNT', sequelize.col('ID')), 'totalComments'],
                [sequelize.fn('AVG', sequelize.col('Rating')), 'averageRating'],
                [sequelize.fn('COUNT', sequelize.col('ParentComment_id')), 'totalReplies']
            ],
            group: ['Show_id']
        });
        
        return { 
            success: true, 
            data: {
                totalComments: stats?.dataValues.totalComments || 0,
                averageRating: stats?.dataValues.averageRating || 0,
                totalReplies: stats?.dataValues.totalReplies || 0
            }
        };
    } catch (error) {
        console.error('Ошибка при получении статистики:', error);
        return { success: false, error: error.message };
    }
}


async getUserComments(userId) {
    try {
        if (!userId || isNaN(userId)) {
            return { 
                success: false, 
                error: 'Неверный ID пользователя',
                data: [] 
            };
        }

        const comments = await Comments.findAll({
            where: { 
                User_id: userId,
                Status: { [Op.ne]: 'deleted' } // Исключаем удалённые комментарии
            },
            include: [
                {
                    model: Users,
                    attributes: ['ID', 'Name', 'Surname', 'Email']
                },
                {
                    model: Shows, 
                    attributes: ['ID', 'Title', 'Genre', 'Poster']
                },
                {
                    model: Comments,
                    as: 'Replies',
                    include: [
                        {
                            model: Users,
                            attributes: ['ID', 'Name', 'Surname', 'Email']
                        }
                    ],
                    where: {
                        Status: { [Op.ne]: 'deleted' }
                    },
                    required: false
                }
            ],
            order: [
                ['CreatedAt', 'DESC'], // Сначала новые комментарии
                [{ model: Comments, as: 'Replies' }, 'CreatedAt', 'ASC']
            ]
        });

        // Группируем комментарии по спектаклям
        const groupedByShow = comments.reduce((acc, comment) => {
            const showId = comment.Show_id;
            if (!acc[showId]) {
                acc[showId] = {
                    show: {
                        id: comment.Show?.ID || comment.Show?.id,
                        title: comment.Show?.title,
                        genre: comment.Show?.genre,
                        poster: comment.Show?.poster
                    },
                    comments: []
                };
            }
            acc[showId].comments.push(comment);
            return acc;
        }, {});

        return { 
            success: true, 
            data: {
                total: comments.length,
                groupedByShow: Object.values(groupedByShow),
                allComments: comments
            }
        };
    } catch (error) {
        console.error('Ошибка при получении комментариев пользователя:', error);
        return { 
            success: false, 
            error: error.message,
            data: []
        };
    }
}

}

module.exports = new UserService();
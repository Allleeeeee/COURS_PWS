const UserService = require('../services/UserService.js');
const {validationResult} = require('express-validator');
const ApiError = require('../exceptions/apierror');
const {Theatres, Rows, Seats,Users, TokenShemes, Managers, Cast, Show, Show_Cast, Seance, Ticket} = require("../models/models.js")


class UserController{
    async registration(req, res,next){
        try{
            const errors = validationResult(req);
            if(!errors.isEmpty()){
                return next(ApiError.BadRequest('Ошибка валидации: ', errors.array()));
            }
            const {email, password, name, surname} = req.body;
            const userData = await UserService.registration(email,password,name,surname);
            res.cookie('refreshToken', userData.refreshToken,{maxAge: 30 * 24 * 60 * 60 * 1000, httpOnly:true})
            return res.status(201).json(userData);
    } catch (err) {
       next(err);
    } 
}

    async login(req, res,next){
        try{
            const {email, password} = req.body;
            const userAgent = req.headers['user-agent'];
            const ip = req.ip;
            const userData = await UserService.login(email,password,userAgent,ip);
            res.cookie('refreshToken', userData.refreshToken,{maxAge: 30 * 24 * 60 * 60 * 1000, httpOnly:true})
            return res.status(201).json(userData);

        }catch(err){
            next(err);
        }
    } 


    async logout(req, res,next){
        try{
            const{refreshToken} = req.cookies;
            const token = await UserService.logout(refreshToken);
            res.clearCookie('refreshToken');
            return res.json(token);

        }catch(err){
            next(err);
        }
    }
    
    async activate(req, res,next){
        try{
        const activationLink = req.params.link;
        await UserService.activate(activationLink);
        return res.redirect(process.env.CLIENT_URL);

        }catch(err){
            console.log(err);
            next(err);
        }
    } 

    async refresh(req, res,next){
        try{
            const {refreshToken} = req.cookies;
            const userAgent = req.headers['user-agent'];
            const ip = req.ip;
            const userData = await UserService.refresh(refreshToken, userAgent, ip);
            res.cookie('refreshToken', userData.refreshToken,{maxAge: 30 * 24 * 60 * 60 * 1000, httpOnly:true})
            return res.status(201).json(userData);

        }catch(err){
            next(err)
        }
    } 

    async getUsers(req, res,next){
        try{
            const users = await UserService.getAllUsers();
            return res.json(users);

        }catch(err){
            next(err);
        }
    } 

    async getClients(req,res,next){
        try{
            const clients = await UserService.getClients();
            return res.json(clients);

        }catch(err){
            next(err);
        }
    };

    async getUser(req, res,next){
        try{
            const {id} = req.params;
            const user = await UserService.getUser(id);
            return res.json(user);

        }catch(err){
            next(err);
        }
    } 
    async updateUser(req, res,next){
        try{
            const {id} = req.params;
            const {password, name, surname} = req.body;
            const user = await UserService.updateUser(id,password, name, surname);
            return res.json(user);

        }catch(err){
            next(err);
        }
    } 

    async verifyCurrentPassword(req,res,next){
        try{
            const {id} = req.params;
            const {currentPassword} = req.body;
            const pass = await UserService.verifyCurrentPassword(id,currentPassword);
            return res.json(pass);
        }catch(err){
            next(err);
        }
    }

     async createComment(req, res, next) {
        try {
            const { userId, showId, content, rating } = req.body;
            const comment = await UserService.createShowComment(userId, showId, content, rating);
            return res.json(comment);
        } catch(err) {
            next(err);
        }
    }

    // Ответить на существующий комментарий
    async replyToComment(req, res, next) {
        try {
            const { userId, parentCommentId, content } = req.body;    
            const reply = await UserService.replyToComment(userId, parentCommentId, content);
            console.log(JSON.stringify(reply));
            return res.json(reply);
        } catch(err) {
            next(err);
        }
    }

    // Получить все комментарии спектакля
    async getShowComments(req, res, next) {
        try {
            const { showId } = req.params;
            
            const comments = await UserService.getShowComments(Number(showId));
           console.log("ОТДАЮ В КОНТРОЛЛЕР:", JSON.stringify(comments, null, 2));
            return res.json(comments);
        } catch(err) {
            next(err);
        }
    }

   

    // Редактировать комментарий
    async updateComment(req, res, next) {
        try {
            const { commentId } = req.params;
            const { userId, content } = req.body;
            
            const updatedComment = await UserService.updateComment(commentId, userId, content);
            return res.json(updatedComment);
        } catch(err) {
            next(err);
        }
    }

    // Удалить комментарий
    async deleteComment(req, res, next) {
        try {
            const {userId,commentId} = req.params;
            
            const result = await UserService.deleteComment(userId,commentId);
            return res.json(result);
        } catch(err) {
            next(err);
        }
    }

    // Получить статистику комментариев для спектакля
    async getCommentsStats(req, res, next) {
        try {
            const { showId } = req.params;
            
            const stats = await UserService.getCommentsStats(showId);
            return res.json(stats);
        } catch(err) {
            next(err);
        }
    }

    async getShowComments(req, res, next) {
        try {
            const { showId } = req.params;
            
            const comms = await UserService.getShowComments(showId);
            return res.json(comms);
        } catch(err) {
            next(err);
        }
    }

     async getUserComments(req, res, next) {
        try {
            const { userId } = req.params;
            
            const comms = await UserService.getUserComments(userId);
            return res.json(comms);
        } catch(err) {
            next(err);
        }
    }

    

}

module.exports = new UserController();
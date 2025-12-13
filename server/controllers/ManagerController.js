const {validationResult} = require('express-validator');
const ApiError = require('../exceptions/apierror');
const {Theatres, Rows, Seats,Users, TokenShemes, Managers, Cast, Show, Show_Cast, Seance, Ticket} = require("../models/models.js")
const ManagerService = require('../services/ManagerService.js');

class ManagerController{
    async addManager(req, res, next) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return next(ApiError.BadRequest('Ошибка валидации: ', errors.array()));
            }
            
            const {email, password, name, surname, phoneNumber, theatreId, addInfo} = req.body;
            const managerData = await ManagerService.addManager(
                email, password, name, surname, phoneNumber, theatreId, addInfo
            );
            
            return res.status(201).json({
                message: 'Менеджер успешно создан. На почту отправлена ссылка для активации.',
                manager: managerData.manager,
                user: managerData.user
            });
        } catch (err) {
            next(err);
        }
    }

    async delManager(req,res,next){
        try{
            const errors = validationResult(req);
            if(!errors.isEmpty()){
                return next(ApiError.BadRequest('Ошибка валидации: ', errors.array()));
            }
            const { id } = req.params
            if (!id || isNaN(id)) {
                return next(ApiError.BadRequest("Некорректный ID"));
            }
            const delMan = await ManagerService.delManager(Number(id));
            return res.status(202).json(delMan);
        }catch(err){
            next(err);
        }
    } 

    async updateManager(req,res,next){
        try{
       
            const {managerId, email, password, name, surname, phoneNumber, theatreId, addInfo} = req.body;
            const managerData = await ManagerService.updateManager(Number(managerId), email, password, name, surname, phoneNumber, theatreId,addInfo);
            return res.status(200).json(managerData);

        }catch(err){
            next(err);
        }
    }

    async getAllManagers(req,res,next){
        try{
            const managers = await ManagerService.getAllManagers();
                        return res.status(200).json(managers);
            

        }catch(err){
            next(err);
        }
    }

   async getManagerByUserId(req, res, next){
    try{
        const {id} = req.params;
        const manager = await ManagerService.getManagerByUserId(Number(id));
        return res.json(manager);
    }catch(err){
        next(err);
    }
   };

   async getTheatreByManager (req, res, next){
    try{
        const {id} = req.params;
        const manager = await ManagerService.getTheatreByManager(Number(id));
        return res.json(manager);
    }catch(err){
        next(err);
    }
   };

};
module.exports = new ManagerController();
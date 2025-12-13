const SeanceService = require('../services/SeanceService.js')
const {validationResult} = require('express-validator');
const ApiError = require('../exceptions/apierror');
const {Theatres, Rows, Seats,Users, TokenShemes, Managers, Cast, Show, Show_Cast, Seances, Ticket} = require("../models/models.js")

class SeanceController {
    async getSeances(req,res,next){
        try{
            const seances = await SeanceService.getSeances();
            return res.json(seances);
        }catch(err){
            next(err);
        }
    }

    async getSeanceById(req,res,next){
        try{
            const {id} = req.params;
            const seance = await SeanceService.getSeanceById(Number(id));
            return res.json(seance);
        }catch(err){
            next(err);
        }
    }

async getSeanceByDate(req,res,next){
        try{
            const {date} = req.body;
            const seances = await SeanceService.getSeancesByDate(date);
            return res.json(seances);
        }catch(err){
            next(err);
        }
    }

    async addSeance(req,res,next){
        try{
            const errors = validationResult(req);
        if(!errors.isEmpty()){
           return next(ApiError.BadRequest('Ошибка валидации: ', errors.array()));}
            const {theatre_id,manager_user_id, show_id, start_time, end_time, status} = req.body;
            const newSeance = await SeanceService.addSeance(theatre_id,manager_user_id, show_id, start_time, end_time, status);
            return res.status(201).json(newSeance);


        }catch(err){
            next(err);
        }
    }

    async updateSeance(req,res,next){
        try{
            const errors = validationResult(req);
            if(!errors.isEmpty()){
               return next(ApiError.BadRequest('Ошибка валидации: ', errors.array()));}
          const {seance_id,manager_user_id, theatre_id, show_id, start_time, end_time, status} = req.body;
          const newSeance = await SeanceService.updateSeance(seance_id,manager_user_id, theatre_id, show_id, start_time, end_time, status);
          return res.status(200).json(newSeance);

        }catch(err){
            next(err);
        }
    }

    async deleteSeance(req,res,next){
        try{
            const {id, manager_user_id} = req.params;
            if (!id || isNaN(id)) {
                return next(ApiError.BadRequest("Некорректный ID"));
            };
            const delSeance = await SeanceService.deleteSeance(Number(id), Number(manager_user_id));
            return res.status(204).json(delSeance);
        }catch(err){
            next(err);
        }
    }

    async canselSeance(req,res,next){
        const {id,manager_user_id} = req.params;
        if (!id || isNaN(id)) {
            return next(ApiError.BadRequest("Некорректный ID"));
        };
    const canseled = await SeanceService.cancelSeance(id, manager_user_id);
    return res.status(200).json(canseled);
    };

    async getSeancesWithDetails(req,res,next){
        try{
            const seances = await SeanceService.getSeancesWithDetails();
            return res.json(seances);
        }catch(err){
            next(err);
        }
    }

    async getSeancesByTheatre(req,res,next){
        try{
            const {id} = req.params;
            const seances = await SeanceService.getSeancesByTheatre(Number(id));
            return res.json(seances);
        }catch(err){
            next(err);
        }
    }

    async userHasTicketForSeance(req, res, next) {
        try {
          const { userId, seanceId } = req.params;
          
          // Валидация параметров
          if (userId === undefined || seanceId === undefined) {
            return res.status(400).json({ error: 'Missing parameters' });
          }
      
          // Логирование входящих параметров
          console.log('Checking ticket for:', { userId, seanceId });
      
          const hasTicket = await SeanceService.userHasTicketForSeance(
            Number(userId), 
            Number(seanceId)
          );
          
          return res.json({ hasTicket });
        } catch (err) {
          console.error('Controller error:', err);
          next(err);
        }
      }

    async getMaxPrice(req,res,next){
        try{
            const {id} = req.params;
            const maxprice = await SeanceService.getMaxPrice(id)
            return res.json(maxprice);
        }catch(err){
            next(err);
        }
    }

    async getMinPrice(req,res,next){
        try{
            const {id} = req.params;
            const minprice = await SeanceService.getMinPrice(id)
            return res.json(minprice);
        }catch(err){
            next(err);
        }
    }

    async getTicket(req,res,next){
        try{
            const{id} = req.params;
            const {seat_id, user_id} = req.body;
            const ticket = await SeanceService.getTicket(id, seat_id, user_id);
            res.json(ticket);
        }catch(err){
            next(err)
        }
    }

    async getStatus (req,res,next){
        try{
            const { id } = req.params;
            const bookedSeatIds = await SeanceService.getStatus(id)
            res.status(200).json({ bookedSeatIds });
        }catch(err){
            next(err);
        }
    }

    async getTicketsByClientId(req,res,next){
        try{
            const { id } = req.params;
            const ticket = await SeanceService.getTicketsByClientId(id);
            res.status(200).json({ ticket });
        }catch(err){
            next(err);
        }
    }

    async getPersonalRecommendations(req,res,next){
        try{
            const { id } = req.params;
            const seance = await SeanceService.getPersonalRecommendations(id);
            res.status(200).json({ seance });
        }catch(err){
            next(err);
        }
    }

      async getPersonalRecommendationsByActors(req,res,next){
        try{
            const { id } = req.params;
            const seance = await SeanceService.getPersonalRecommendationsByActors(id);
            res.status(200).json({ seance });
        }catch(err){
            next(err);
        }
    }

       async getPersonalRecommendationsByPlaywrights(req,res,next){
        try{
            const { id } = req.params;
            const seance = await SeanceService.getPersonalRecommendationsByPlaywrights(id);
            res.status(200).json({ seance });
        }catch(err){
            next(err);
        }
    }

    async deleteTicket(req,res,next){
        try{
            const {id} = req.params;
            if (!id || isNaN(id)) {
                return next(ApiError.BadRequest("Некорректный ID"));
            };
            const delTicket = await SeanceService.deleteTicket(Number(id));
            return res.status(204).json(delTicket);
        }catch(err){
            next(err);
        }
    }

    async getTicketsWithDetails(req,res,next){
        try{
            const tickets = await SeanceService.getTicketsWithDetails();
            return res.json(tickets);
        }catch(err){
            next(err);
        }
    }
     async getTicketsWithDetailsByTh(req,res,next){
        try{
            const {id} = req.params;
            const tickets = await SeanceService.getTicketsWithDetailsByTh(Number(id));
            return res.json(tickets);
        }catch(err){
            next(err);
        }
    }


}
module.exports = new SeanceController();
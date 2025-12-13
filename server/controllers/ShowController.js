const ShowService = require('../services/ShowService.js')
const {validationResult} = require('express-validator');
const ApiError = require('../exceptions/apierror');

const {Theatres, Rows, Seats,Users, TokenShemes, Managers, Cast, Shows, Show_Cast, Seance, Ticket} = require("../models/models.js")

class ShowController {
    async getShows(req,res,next){
        try{
            const shows = await ShowService.getShows();
            return res.json(shows);
        }catch(err){
            next(err);
        }
    };

    async getShowsByManager(req,res,next){
        try{
            const {manager_user_id} = req.params;
            const shows = await ShowService.getShowsByManager(manager_user_id);
            return res.json(shows);
        }catch(err){
            next(err);
        }
    };

    async getShowsWithDetailsById(req,res,next){
        try{
            const {id} = req.params;
            const shows = await ShowService.getShowsWithDetailsById(id);
            return res.json(shows);
        }catch(err){
            next(err);
        }
    };

     async getShowDuration(req,res,next){
        try{
            const {id} = req.params;
            const show = await ShowService.getShowDuration(id);
            return res.json(show);
        }catch(err){
            next(err);
        }
    };

    async getShowsByTheatre(req, res,next){
        try{
            const {id} = req.params;
            console.log(id);
            const shows = await ShowService.getShowsByTheatre(Number(id));
            return res.json(shows);
        }catch(err){
            next(err);
        }
    }

    async getShowById(req,res,next){
        try{
            const { id } = req.params
            if (!id || isNaN(id)) {
                return next(ApiError.BadRequest("Некорректный ID"));
            }
            const show = await ShowService.getShowById(Number(id));
            return res.json(show);

        }catch(err){
            next(err);
        }
    }

    async addShow(req, res, next) {
        try {
          const { manager_user_id, title, genre, description, rating, theatreId, start_price, actorIds, roles,duration,partsCount,ageRestriction } = req.body;
          const poster = req.file; // Файл обрабатывается Multer
          
          if (!poster) {
            return res.status(400).json({ message: "Файл изображения обязателен" });
          }
      
          // Преобразуем actorIds и roles в массивы
          const actorsArray = actorIds 
            ? typeof actorIds === 'string' 
              ? actorIds.split(',').map(id => parseInt(id.trim())) 
              : Array.isArray(actorIds) 
                ? actorIds 
                : []
            : [];
      
          const rolesArray = roles 
            ? typeof roles === 'string' 
              ? roles.split(',') 
              : Array.isArray(roles) 
                ? roles 
                : []
            : [];
      console.log(manager_user_id);
          const showData = await ShowService.addShow(
            Number(manager_user_id),
            title, 
            genre, 
            description, 
            rating, 
            theatreId, 
            poster, 
            start_price, 
            actorsArray,
            rolesArray,
            Number(duration),
            Number(partsCount),
            ageRestriction
          );
          
          return res.status(201).json(showData);
        } catch(err) {
          next(err);
        }
      }

    async deleteShow(req,res,next){
        try{
            const { id, manager_user_id } = req.params
            if (!id || isNaN(id)) {
                return next(ApiError.BadRequest("Некорректный ID"));
            }
            const deletedShow = await ShowService.deleteShow(Number(id), Number(manager_user_id));
            return res.status(204).json(deletedShow);
        }catch(err){
            next(err);
        }
    }

    async updateShow(req, res, next) {
        try {
            const { 
                id,
                manager_user_id, 
                title, 
                genre, 
                description, 
                theatreId, 
                start_price,
                actorIds,
                roles,
                duration,
                partsCount,
                ageRestriction
            } = req.body;
            
            const poster = req.file;

            const actorsArray = actorIds 
                ? typeof actorIds === 'string' 
                    ? actorIds.split(',').map(id => parseInt(id.trim())) 
                    : Array.isArray(actorIds) 
                        ? actorIds 
                        : []
                : [];
    
            const rolesArray = roles 
                ? typeof roles === 'string' 
                    ? roles.split(',') 
                    : Array.isArray(roles) 
                        ? roles 
                        : []
                : [];
    
            const updatedShow = await ShowService.updateShow(
                id,
                manager_user_id, 
                title, 
                genre, 
                description,  
                theatreId, 
                poster,
                start_price,
                actorsArray,
                rolesArray,
                duration,
                partsCount,
                ageRestriction
            );
            
            return res.json(updatedShow);
        } catch (err) {
            next(err);
        }
    };
    //---------------------------------------------------------
async addCast(req, res, next){
    try{
        const errors = validationResult(req);
        if(!errors.isEmpty()){
           return next(ApiError.BadRequest('Ошибка валидации: ', errors.array()));}
        const{name, surname, description, theatre_id, roleType} = req.body;
        const photo = req.file;   
      if (!photo) {
        return res.status(400).json({ message: "Файл изображения обязателен" });
      }
        const newCastmember = ShowService.addCast(name, surname, photo, description, theatre_id, roleType);
        return res.status(201).json(newCastmember);
    }catch(err){
        next(err);
    }
}

async updateCast(req,res,next){
    try{
        const errors = validationResult(req);
        if(!errors.isEmpty()){
           return next(ApiError.BadRequest('Ошибка валидации: ', errors.array()));}
           const {id, name, surname, photo, description, show_id} = req.body;
           const newCast = await ShowService.updateCast(id, name, surname, photo, description, show_id);
           return res.status(204).json(newCast);
    }catch(err){
        next(err);
    }
}

async deleteCast(req,res,next){
    try{
        const {id} = req.params;
        if (!id || isNaN(id)) {
            return next(ApiError.BadRequest("Некорректный ID"));
        };
        const delShow = await ShowService.deleteCast(Number(id));
        return res.status(204).json(delShow);
    }catch(err){
        next(err);
    }
}

async getCast(req, res, next) {
    try {
      if (req.params.id) {
        // Запрос конкретного актера
        const actor = await ShowService.getCast(req.params.id);
        return res.json(actor);
      } else {
        // Запрос всех актеров
        const allActors = await ShowService.getCast();
        return res.json(allActors);
      }
    } catch(err) {
      next(err);
    }
};

async getActor(req, res, next) {
    try {
      if (req.params.id) {
        // Запрос конкретного актера
        const actor = await ShowService.getActors(req.params.id);
        return res.json(actor);
      } else {
        // Запрос всех актеров
        const allActors = await ShowService.getActors();
        return res.json(allActors);
      }
    } catch(err) {
      next(err);
    }
};

async getPlaywrights(req, res, next) {
    try {
      if (req.params.id) {
        // Запрос конкретного актера
        const actor = await ShowService.getPlaywrights(req.params.id);
        return res.json(actor);
      } else {
        // Запрос всех актеров
        const allActors = await ShowService.getPlaywrights();
        return res.json(allActors);
      }
    } catch(err) {
      next(err);
    }
};

async getShowsByActorId (req, res, next) {
    try {
        const { id } = req.params;
        const shows = await ShowService.getShowsByActorId(id);
       return res.json(shows);
    } catch (err) {
       next(err)
    }
};
  

async rateShow(req,res,next){
    try{
        const { userId, showId, userRating } = req.body;
        console.log("RATING"+userId+showId+userRating);
        const rate = await ShowService.rateShow(Number(userId), Number(showId), Number(userRating));
        return res.json(rate);
    }catch(err){
        next(err);
    }
}

async checkUserRating(req,res,next){
    try{
        const { userId, showId } = req.body;
        const check = await ShowService.checkUserRating(Number(userId), Number(showId));
        return res.json(check);
    }catch(err){
        next(err);
    }
};


}
module.exports = new ShowController();

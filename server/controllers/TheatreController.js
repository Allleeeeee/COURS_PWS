const TheatreService = require('../services/TheatreService.js')
const {validationResult} = require('express-validator');
const ApiError = require('../exceptions/apierror');
const {Theatres, Rows, Seats,Users, TokenShemes, Managers, Cast, Show, Show_Cast, Seance, Ticket} = require("../models/models.js");
const ShowService = require('../services/ShowService.js');

class TheatreController{
    async getTheatres(req,res,next){
        try{
        const theatres = await TheatreService.getTheatres();
        return res.json(theatres);
        }catch(err){
            next(err);
        }
    };

    async getTheatreById(req,res,next){
        try{
            const{id} = req.params;
        const theatre = await TheatreService.getTheatreById(id)
        return res.json(theatre);
        }catch(err){
            next(err);
        }
    };

    async addTheatre(req,res,next){
        try{
       
        const {thName,thCity, thAddress,thEmail,thPhone,thDescription, workingHours, latitude, longitude} = req.body;
        const theatreData = await TheatreService.addTheatre(thName,thCity, thAddress,thEmail,thPhone,thDescription, workingHours,latitude, longitude);
        console.log(theatreData);
        return res.status(201).json(theatreData);
        
         }catch(err){
            console.log("Ошибка на сервере:", err);
            next(err);
         }
    }

    async updateTheatre(req,res,next){
        try{
            const errors = validationResult(req);
            if(!errors.isEmpty()){
               return next(ApiError.BadRequest('Ошибка валидации: ', errors.array()));}
           const {id,thName,thCity, thAddress,thEmail,thPhone,thDescription,workingHours, latitude, longitude} = req.body;
           console.log("latitude"+ latitude);
           const newTheatreData = await TheatreService.updateTheatre(id,thName,thCity, thAddress,thEmail,thPhone,thDescription, workingHours, latitude, longitude);
           console.log("after controller update"+ JSON.stringify(newTheatreData));
        return res.status(200).json(newTheatreData);
      
        }catch(err){
            next(err);
        }
    }

    async deleteTheatre(req, res, next) {
        try {
            const { id } = req.params;
            console.log("Пришёл запрос на удаление ID:", req.params.id);
            if (!id || isNaN(id)) {
                return next(ApiError.BadRequest("Некорректный ID"));
            }
            const deletedTh = await TheatreService.deleteTheatre(Number(id));
            return res.status(202).json(deletedTh);
        } catch (err) {
            next(err);
        }
    }

    async addSectors(req, res, next){
        try{
            const {type, from, to, placeCount, priceMarkUp, theatre_id} = req.body;
            const sectorData = await TheatreService.addSectors(type, Number(from), Number(to), Number(placeCount), priceMarkUp, theatre_id);
            return res.status(201).json(sectorData);

        }catch(err){
            next(err)
        }
    }
    async deleteSectors(req,res,next){
        try{
            const {theatre_id, type, from, to} = req.body;
            console.log(type);
            const delSector = await TheatreService.deleteSectors(theatre_id, type, from, to);
            return res.status(204).json(delSector);
        }catch(err){
            next(err);
        }
    };

    async getRowsByTheatre(req,res,next){
        try{
            const { theatre_id } = req.params;
            const rows = await TheatreService.getRowsByTheatre(theatre_id);
            res.json(rows);

        }catch(err){
            console.error("Ошибка получения рядов:", err);
            next(err);
        }
    }

    async getLastRow(req,res,next){
 try{
            const { theatre_id, rowType } = req.body;
            const rows = await TheatreService.getLastRow(Number(theatre_id), rowType)
            res.json(rows);

        }catch(err){
            console.error("Ошибка получения рядов:", err);
            next(err);
        }
    };
    
}

module.exports = new TheatreController();

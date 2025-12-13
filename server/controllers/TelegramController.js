const { Users } = require("../models/models.js");
const TelegramService = require("../services/TelegramService");

class TelegramController {
    async generateCode(req, res, next) {
        try {
            const { id } = req.body;
            const code = await TelegramService.generateCode(Number(id));
            res.json({ code });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new TelegramController();
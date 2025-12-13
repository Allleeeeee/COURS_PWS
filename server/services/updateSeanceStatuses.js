const { Seances } = require("../models/models.js");
const moment = require("moment-timezone");
const { Op } = require("sequelize");

async function updateSeanceStatuses() {
    try {
    
        const now = moment().utc().add(3, 'hours').format("YYYY-MM-DD HH:mm:ss");

        const affectedRows = await Seances.update(
            { Status: "Проведён" },
            {
                where: {
                    End_time: { [Op.lte]: now }, 
                    Status: { [Op.ne]: "Проведён" }
                }
            }
        );

        if (affectedRows[0] > 0) {
            console.log(`Обновлено ${affectedRows[0]} сеансов`);
        }
    } catch (error) {
        console.error("Ошибка при обновлении статусов сеансов:", error);
    }
}

setInterval(updateSeanceStatuses,  1000); 

module.exports = { updateSeanceStatuses };

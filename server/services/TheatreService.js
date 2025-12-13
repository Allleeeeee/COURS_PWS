const { where } = require("sequelize");
const { Op } = require("sequelize"); 
const {Theatres, Rows, Seats,Users, TokenShemes, Managers, Cast, Show, Show_Cast, Seance, Ticket, Casts} = require("../models/models.js");
const ApiError = require('../exceptions/apierror.js')

class TheatreService{

    async getTheatres(){
        const theatres = await Theatres.findAll();
        return theatres;
    }
async getTheatreById(id) {
    try {
        const theatre = await Theatres.findByPk(id, {
            include: [
                {
                    model: Casts,
                    // Без alias, так как в модели он не указан
                    attributes: ['Cast_id', 'Name', 'Surname', 'Photo', 'Description', 'RoleType']
                }
            ],
            attributes: ['ID', 'ThName', 'ThCity', 'ThAddress', 'ThDescription', 'ThPhone', 'ThEmail', 'WorkingHours', 'ThLatitude', 'ThLongitude']
        });

        if (!theatre) {
            return null;
        }

        // Группируем труппу по типам ролей
        const groupedCasts = {
            actors: [],
            directors: [],
            playwrights: []
        };

        // Проверяем, что Casts существует и является массивом
        // Sequelize использует имя модели (Casts) для доступа к данным
        if (theatre.Casts && Array.isArray(theatre.Casts)) {
            theatre.Casts.forEach(cast => {
                const castData = {
                    id: cast.Cast_id,
                    name: cast.Name,
                    surname: cast.Surname,
                    fullName: `${cast.Name} ${cast.Surname}`,
                    photo: cast.Photo,
                    description: cast.Description,
                    roleType: cast.RoleType
                };

                switch (cast.RoleType) {
                    case 'actor':
                        groupedCasts.actors.push(castData);
                        break;
                    case 'director':
                        groupedCasts.directors.push(castData);
                        break;
                    case 'playwright':
                        groupedCasts.playwrights.push(castData);
                        break;
                }
            });
        }

        // Сортируем по фамилии внутри каждой группы
        groupedCasts.actors.sort((a, b) => a.surname.localeCompare(b.surname));
        groupedCasts.directors.sort((a, b) => a.surname.localeCompare(b.surname));
        groupedCasts.playwrights.sort((a, b) => a.surname.localeCompare(b.surname));

        return {
            id: theatre.ID,
            name: theatre.ThName,
            city: theatre.ThCity,
            address: theatre.ThAddress,
            description: theatre.ThDescription,
            phone: theatre.ThPhone,
            email: theatre.ThEmail,
            workingHours: theatre.WorkingHours,
            latitude: theatre.ThLatitude,
            longitude: theatre.ThLongitude,
            casts: groupedCasts,
            stats: {
                totalActors: groupedCasts.actors.length,
                totalDirectors: groupedCasts.directors.length,
                totalPlaywrights: groupedCasts.playwrights.length,
                totalCasts: groupedCasts.actors.length + groupedCasts.directors.length + groupedCasts.playwrights.length
            }
        };
    } catch (error) {
        console.error('Error getting theatre by ID:', error);
        throw error;
    }
}
    async addTheatre(thName, thCity, thAddress, thEmail, thPhone, thDescription, workingHours, latitude, longitude) {
    const existingByNameAndCity = await Theatres.findOne({
        where: { 
            ThName: thName,
            ThCity: thCity 
        }
    });
    if (existingByNameAndCity) {
        throw ApiError.BadRequest("Театр с таким названием уже существует в этом городе");
    }

    const existingByAddressAndCity = await Theatres.findOne({
        where: { 
            ThAddress: thAddress,
            ThCity: thCity 
        }
    });
    if (existingByAddressAndCity) {
        throw ApiError.BadRequest("Театр с таким адресом уже существует в этом городе");
    }


    if (thEmail) { 
        const existingByEmail = await Theatres.findOne({
            where: { ThEmail: thEmail }
        });
        if (existingByEmail) {
            throw ApiError.BadRequest("Театр с такой почтой уже существует");
        }
    }
    
    if (thPhone) { 
        const existingByPhone = await Theatres.findOne({
            where: { ThPhone: thPhone }
        });
        if (existingByPhone) {
            throw ApiError.BadRequest("Театр с таким телефоном уже существует");
        }
    }

    const theatre = await Theatres.create({
        ThName: thName,
        ThAddress: thAddress,
        ThCity: thCity, 
        ThEmail: thEmail,
        ThPhone: thPhone,
        ThDescription: thDescription,
        WorkingHours: workingHours,
        ThLatitude: latitude,
        ThLongitude: longitude
    });
    
    return theatre;
}

   async updateTheatre(id, thName,thCity, thAddress, thEmail, thPhone, thDescription, workingHours, latitude, longitude) {
    const theatre = await Theatres.findByPk(id);
    if (!theatre) {
        throw ApiError.BadRequest("Театр с указанным ID не найден");
    }
    const whereConditions = [];

    if (thName || thCity) {
        whereConditions.push({
            ThName: thName || theatre.ThName,
            ThCity: thCity || theatre.ThCity
        });
    }

    if (thAddress || thCity) {
        whereConditions.push({
            ThAddress: thAddress || theatre.ThAddress,
            ThCity: thCity || theatre.ThCity
        });
    }

    if ((thName || thAddress || thCity)) {
        whereConditions.push({
            ThName: thName || theatre.ThName,
            ThAddress: thAddress || theatre.ThAddress,
            ThCity: thCity || theatre.ThCity
        });
    }

    if (thEmail) {
        whereConditions.push({ ThEmail: thEmail });
    }
    
    if (thPhone) {
        whereConditions.push({ ThPhone: thPhone });
    }

    const existingTheatre = await Theatres.findOne({
        where: {
            [Op.or]: whereConditions,
            ID: { [Op.ne]: id }
        }
    });

    if (existingTheatre) {
        let conflictMessage = "Конфликт с существующим театром";
        
        if (existingTheatre.ThName === (thName || theatre.ThName) && 
            existingTheatre.ThCity === (thCity || theatre.ThCity)) {
            conflictMessage = "Театр с таким названием уже существует в этом городе";
        } else if (existingTheatre.ThAddress === (thAddress || theatre.ThAddress) && 
                   existingTheatre.ThCity === (thCity || theatre.ThCity)) {
            conflictMessage = "Театр с таким адресом уже существует в этом городе";
        } else if (existingTheatre.ThEmail === thEmail) {
            conflictMessage = "Театр с такой почтой уже существует";
        } else if (existingTheatre.ThPhone === thPhone) {
            conflictMessage = "Театр с таким телефоном уже существует";
        }
        
        throw ApiError.BadRequest(conflictMessage);
    }

    await theatre.update({
        ThName: thName || theatre.ThName,
        ThCity: thCity || theatre.ThCity, 
        ThAddress: thAddress || theatre.ThAddress,
        ThEmail: thEmail || theatre.ThEmail,
        ThPhone: thPhone || theatre.ThPhone,
        ThDescription: thDescription || theatre.ThDescription,
        WorkingHours: workingHours || theatre.WorkingHours,
        ThLatitude: latitude || theatre.ThLatitude,
        ThLongitude: longitude || theatre.ThLongitude
    });
    console.log("after update"+ JSON.stringify(theatre));
    return theatre;
}

    async deleteTheatre(id) {
        id = Number(id);
        if (!id || isNaN(id)) {
            throw ApiError.BadRequest("Некорректный ID");
        }
        const theatre = await Theatres.findByPk(id);
        if (!theatre) {
            throw ApiError.BadRequest("Театр с указанным ID не найден");
        }
        await theatre.destroy();
        return { message: "Театр успешно удалён" };
    }

    async addSectors(type, from, to, placeCount, priceMarkUp, theatre_id) {
        if (from <= 0 || to <= 0) {
            throw ApiError.BadRequest('Номера рядов должны быть больше 0');
        }
        
        if (from > 100 || to > 100) {
            throw ApiError.BadRequest('Номера рядов не должны быть больше 100');
        }

        if (from > to) {
            throw ApiError.BadRequest('Начальный номер ряда должен быть меньше или равен конечному');
        }
    
        if (placeCount <= 0) {
            throw ApiError.BadRequest('Количество мест в ряду должно быть больше 0');
        }
        if (placeCount > 35) {
            throw ApiError.BadRequest('Количество мест в ряду должно быть меньше 35');
        }
    
    
        const rowPromises = [];
        for (let i = from; i < to+1; i++) {
            const existingRow = await Rows.findOne({
                where: {
                    RowNumber: i,
                    RowType:type,
                    Theatre_id: theatre_id
                }
            });
            if(existingRow){
                throw ApiError.BadRequest(`Ошибка: Ряд ${existingRow.RowNumber} уже добавлен.`)
            }

            rowPromises.push(Rows.create({
                RowNumber: i,
                RowType: type,
                PriceMarkUp: priceMarkUp,
                Theatre_id: theatre_id
            }));
        }
    
        const rows = await Promise.all(rowPromises); 
    
        const seatPromises = [];
    
        rows.forEach((row) => {
            for (let j = 1; j < placeCount+1; j++) {
                seatPromises.push(Seats.create({
                    SeatNumber: j,
                    SeatStatus: 'Свободно',
                    Row_id: row.ID 
                }));
            }
        });
    
        const seats = await Promise.all(seatPromises); 
        return (rows, seats);
    }

    async deleteSectors(theatre_id, type, from, to) {

        if (from < 1 || to < 1 ) {
            throw ApiError.BadRequest('Некорректный диапазон рядов для удаления');
        }
        const rowsToDelete = await Rows.findAll({
            where: {
                RowType: type,
                Theatre_id: theatre_id,
                RowNumber: {
                    [Op.between]: [from, to]
                }
            }
        });
        if (!rowsToDelete || rowsToDelete.length === 0) {
            throw ApiError.BadRequest(`Ряды типа ${type} с номерами от ${from} до ${to} не найдены`);
        }
        const rowIds = rowsToDelete.map(row => row.ID);

        await Seats.destroy({
            where: {
                Row_id: {
                    [Op.in]: rowIds
                }
            }
        });

        const deletedRowsCount = await Rows.destroy({
            where: {
                ID: {
                    [Op.in]: rowIds
                }
            }
        });
    
        return {
            message: `Удалено ${deletedRowsCount} рядов и связанных с ними мест`,
            deletedRows: deletedRowsCount
        };
    }

    async getRowsByTheatre(theatre_id){
        const rows = await Rows.findAll({
            where: { Theatre_id: theatre_id },
            include: [{
                model: Seats,
                as: "Seats",
                required: false, 
            }],
            order: [
                ['RowNumber', 'ASC'], 
                [{ model: Seats, as: "Seats" }, 'SeatNumber', 'ASC'] 
            ]
        });
        return rows;
    }

    async getLastRow(theatre_id, rowType) {
    const th = await Theatres.findByPk(theatre_id);
    if(!th){
         throw ApiError.BadRequest(`Театр с id  ${theatre_id} не найден`);
    };

    const lastRow = await Rows.findOne({
        where: {
            Theatre_id: theatre_id,
            RowType: rowType
        },
        order: [['RowNumber', 'DESC']] 
    });

   return lastRow ? lastRow.RowNumber : 0; 
}
    
    
}
module.exports = new TheatreService();
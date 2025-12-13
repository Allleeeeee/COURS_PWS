// controllers/PoiskkinoController.js
const PoiskKinoService = require('../services/PoiskkinoService');

class PoiskKinoController {
    async searchPersons(req, res, next) {
        try {
            const { query, page = 1, limit = 70 } = req.query;
            
            if (!query) {
                return res.status(400).json({
                    success: false,
                    message: 'Query parameter is required'
                });
            }

            const result = await PoiskKinoService.searchPersons(query, page, limit);
            
            res.json({
                success: true,
                data: result
            });
        } catch (error) {
            next(error);
        }
    }

    async getPersonDetails(req, res, next) {
        try {
            const { id } = req.params;
            const result = await PoiskKinoService.getPersonDetails(id);
            
            res.json({
                success: true,
                data: result
            });
        } catch (error) {
            next(error);
        }
    }

    async searchMovies(req, res, next) {
        try {
            const { query, genre, page = 1, limit = 20 } = req.query;
            
            if (!query && !genre) {
                return res.status(400).json({
                    success: false,
                    message: 'Query or genre parameter is required'
                });
            }

            const result = await PoiskKinoService.searchMovies(query, page, limit);
            
            res.json({
                success: true,
                data: result
            });
        } catch (error) {
            next(error);
        }
    }

    async getMovieDetails(req, res, next) {
        try {
            const { id } = req.params;
            const result = await PoiskKinoService.getMovieDetails(id);
            
            res.json({
                success: true,
                data: result
            });
        } catch (error) {
            next(error);
        }
    }

    async getMovieCast(req, res, next) {
        try {
            const { id } = req.params;
            const result = await PoiskKinoService.getMovieCast(id);
            
            res.json({
                success: true,
                data: result
            });
        } catch (error) {
            next(error);
        }
    }

    async importPerson(req, res, next) {
        try {
            const { id } = req.params;
            
            const personData = await PoiskKinoService.getPersonDetails(id);
            
            const transformedData = {
                Name: personData.name || '',
                Surname: personData.surname || '',
                Photo: personData.photo || null,
                Description: personData.biography || '',
                ExternalId: personData.id,
                ExternalSource: 'poiskkino',
                RoleType: this.determineRoleType(personData)
            };
            
            // Здесь добавь логику сохранения в твою БД через Casts.create()
            
            res.json({
                success: true,
                message: 'Person data retrieved',
                data: transformedData
            });
        } catch (error) {
            next(error);
        }
    }

    async importMovie(req, res, next) {
        try {
            const { id } = req.params;
            
            const movieData = await PoiskKinoService.getMovieDetails(id);
            const castData = await PoiskKinoService.getMovieCast(id);
            
            const transformedData = {
                Title: movieData.title || '',
                Genre: movieData.genres?.join(', ') || '',
                Director: this.findDirector(castData),
                Description: movieData.description || '',
                Poster: movieData.poster || null,
                Rating: movieData.rating || null,
                Duration: movieData.duration || null,
                Year: movieData.year || null,
                ExternalId: movieData.id,
                ExternalSource: 'poiskkino'
            };
            
            res.json({
                success: true,
                message: 'Movie data retrieved',
                data: transformedData,
                cast: castData
            });
        } catch (error) {
            next(error);
        }
    }

    determineRoleType(personData) {
        if (personData.profession?.includes('режиссер')) return 'director';
        if (personData.profession?.includes('актер')) return 'actor';
        if (personData.profession?.includes('сценарист')) return 'playwright';
        return 'other';
    }

    findDirector(castData) {
        const director = castData.find(person => 
            person.profession?.toLowerCase().includes('режиссер')
        );
        return director ? `${director.name} ${director.surname}` : '';
    }
}

module.exports = new PoiskKinoController();
// routes/poiskkino-routes.js
const Router = require('express');
const router = new Router();
const controller = require('../controllers/PoiskkinoController');

// Поиск персон
router.get('/persons/search', controller.searchPersons);

// Получение деталей персоны
router.get('/persons/:id', controller.getPersonDetails);

// Импорт персоны в БД
router.post('/persons/:id/import', controller.importPersonToDatabase);

// Поиск фильмов/спектаклей
router.get('/movies/search', controller.searchMovies);

// Получение деталей фильма
router.get('/movies/:id', controller.getMovieDetails);

// Получение актерского состава
router.get('/movies/:id/cast', controller.getMovieCast);

// Импорт фильма в БД
router.post('/movies/:id/import', controller.importMovieToDatabase);

module.exports = router;
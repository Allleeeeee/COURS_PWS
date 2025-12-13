const Router = require('express').Router;
const UserController = require('../controllers/UserController');
const TheatreController = require('../controllers/TheatreController');
const {body} = require('express-validator');
const nameSurnameRegex = /^[a-zA-Zа-яА-ЯёЁ]+$/;
const phoneRegex = /^\+375\(\d{2}\)\d{3}-\d{2}-\d{2}$/;
const authMiddleware = require('../middlewares/auth_middleware');
const ManagerController = require('../controllers/ManagerController');
const ShowController = require('../controllers/ShowController');
const SeanceController = require('../controllers/SeanceController');
const TelegramController = require('../controllers/TelegramController');
const router = new Router();
const multer = require("multer");
const upload = multer({ dest: "uploads/" });


router.post('/registration', 
    body('email').isEmail().withMessage('Некорректный email'),
    body('name').matches(nameSurnameRegex).withMessage('Имя должно содержать только буквы.'),
    body('surname').matches(nameSurnameRegex).withMessage('Фамилия должно содержать только буквы.'),
    UserController.registration);
router.post('/login', UserController.login);
router.post('/logout', UserController.logout);
// router.get('/activate/:link', UserController.activate);
router.get('/refresh', UserController.refresh);
router.get('/users', authMiddleware(['admin']), UserController.getUsers);
router.get('/clients', authMiddleware(['admin']), UserController.getClients);
router.get('/user/:id', UserController.getUser);
router.put('/updateUser/:id', UserController.updateUser);
router.post('/varifyPassword/:id', UserController.verifyCurrentPassword);

//------------------------------------------------------------------------------
router.post('/addTheatre', authMiddleware(['admin']),
    body('thAddress').isLength({min:10, max:50}).withMessage('Некорректный адрес'),
    body('email').isEmail().withMessage('Некорректный email'),
    body('thPhone').matches(phoneRegex).withMessage('Телефон должен быть в формате +375(хх)ххх-хх-хх'),
    TheatreController.addTheatre);

router.put('/updateTheatre', authMiddleware(['admin']),
    body('thAddress').isLength({min:10, max:50}).withMessage('Некорректный адрес'),
    body('thPhone').matches(phoneRegex).withMessage('Телефон должен быть в формате +375(хх)ххх-хх-хх'),
    TheatreController.updateTheatre);
 
router.delete('/delTheatre/:id', authMiddleware(['admin']),TheatreController.deleteTheatre);
router.post('/addTheatre/addSector',authMiddleware(['admin']), TheatreController.addSectors);   
router.get('/getTheatres',TheatreController.getTheatres);
router.get('/getTheatre/:id',TheatreController.getTheatreById);
router.get('/getRowsByTheatre/:theatre_id', TheatreController.getRowsByTheatre);
router.post('/addTheatre/deleteSector',authMiddleware(['admin']), TheatreController.deleteSectors); 
router.post('/getLastRow',TheatreController.getLastRow);  
//------------------------------------------------------------------------------
router.post('/addManager', authMiddleware(['admin']),
    body('email').isEmail().withMessage('Некорректный email'),
    body('password').isLength({min:3, max:20}),
    body('name').matches(nameSurnameRegex).withMessage('Имя должно содержать только буквы.'),
    body('surname').matches(nameSurnameRegex).withMessage('Фамилия должно содержать только буквы.'),
    ManagerController.addManager)

    router.delete('/deleteManager/:id', ManagerController.delManager);
    
    router.put('/updateManager',authMiddleware(['manager']),
        body('email').isEmail().withMessage('Некорректный email'),
        body('password').isLength({min:3, max:20}),
        body('name').matches(nameSurnameRegex).withMessage('Имя должно содержать только буквы.'),
        body('surname').matches(nameSurnameRegex).withMessage('Фамилия должно содержать только буквы.'),
        ManagerController.updateManager)

    router.get('/getManagers',authMiddleware(['admin']), ManagerController.getAllManagers);
    router.get('/getManagerByUserId/:id',authMiddleware(['manager']), ManagerController.getManagerByUserId);
    router.get('/getTheatreByManager/:id', ManagerController.getTheatreByManager);

    //------------------------------------------------------------------------------2
    router.get('/getShows',ShowController.getShows);
    router.get('/getShowDuration/:id',ShowController.getShowDuration);
    router.get('/getShowsByManager/:manager_user_id',authMiddleware(['manager']), ShowController.getShowsByManager);
    router.get('/getShowsWithDetailsById/:id',ShowController.getShowsWithDetailsById);
    router.get('/getShowById/:id', ShowController.getShowById);
    router.get('/getShowsByTheatre/:id', ShowController.getShowsByTheatre);
    router.post('/addShow',authMiddleware(['manager']),upload.single("poster"),ShowController.addShow);
    router.put('/updateShow',authMiddleware(['manager']), upload.single("poster"),ShowController.updateShow);
    router.delete('/deleteShow/:id/:manager_user_id',authMiddleware(['manager']),ShowController.deleteShow);
    router.post('/rateShow',authMiddleware(['client']), ShowController.rateShow);
    router.post('/checkUserRating',authMiddleware(['client']), ShowController.checkUserRating);
    //------------------------------------------------------------------------------
    router.post('/addCast',authMiddleware(['manager']),
    // body('name').matches(nameSurnameRegex).withMessage('Имя должно содержать только буквы.'),
    // body('surname').matches(nameSurnameRegex).withMessage('Фамилия должно содержать только буквы.'),
    upload.single("photo"),
    ShowController.addCast)
    
    router.put('/updateCast', authMiddleware(['manager']),
    body('name').matches(nameSurnameRegex).withMessage('Имя должно содержать только буквы.'),
    body('surname').matches(nameSurnameRegex).withMessage('Фамилия должно содержать только буквы.'),
    ShowController.updateCast);

    router.delete('/deleteCast/:id',authMiddleware(['manager']), ShowController.deleteCast);
    router.get('/getCast', ShowController.getCast);
    router.get('/getCast/:id', ShowController.getCast);
    router.get('/getActors', ShowController.getActor);
    router.get('/getActors/:id', ShowController.getActor);
    router.get('/getPlaywrights', ShowController.getPlaywrights);
    router.get('/getPlaywrights/:id', ShowController.getPlaywrights);
    router.get('/actors/:id/shows', ShowController.getShowsByActorId);

    //------------------------------------------------------------------------------
    router.get('/getSeances',SeanceController.getSeances);
    router.get('/getSeance/:id',SeanceController.getSeanceById);
    router.get('/getSeanceByDate',SeanceController.getSeanceByDate);
    router.post('/addSeance',authMiddleware(['manager']),SeanceController.addSeance);
    router.put('/updateSeance',authMiddleware(['manager']), SeanceController.updateSeance);
    router.delete('/deleteSeance/:id/:manager_user_id',authMiddleware(['manager']), SeanceController.deleteSeance);
    router.get('/getSeancesWithDetails', SeanceController.getSeancesWithDetails);
    router.get('/getMaxPrice/:id', SeanceController.getMaxPrice)
    router.get('/getMinPrice/:id', SeanceController.getMinPrice)
    router.get('/getSeancesByTheatre/:id', SeanceController.getSeancesByTheatre);
    router.get('/getTicketsWithDetails', SeanceController.getTicketsWithDetails);
    router.get('/getTicketsWithDetails/:id', SeanceController.getTicketsWithDetailsByTh);
    router.put('/canselSeance/:id/:manager_user_id',authMiddleware(['manager']), SeanceController.canselSeance);
    //!!!!!!!!!!!!!!!!11
    router.get('/userHasTicketForSeance/:userId/:seanceId',authMiddleware(), SeanceController.userHasTicketForSeance);
    //------------------------------------------------------------------------------
    router.post('/getTicket/:id',authMiddleware(['client']), SeanceController.getTicket);
    router.get('/getStatus/:id',authMiddleware(['client']), SeanceController.getStatus);
    router.get('/getTicketsByClientId/:id',authMiddleware(['client']), SeanceController.getTicketsByClientId);
    router.delete('/deleteTicket/:id',authMiddleware(['client']), SeanceController.deleteTicket);
    router.get('/getPersonalRecommendations/:id', SeanceController.getPersonalRecommendations);
    router.get('/getPersonalRecommendationsByActors/:id', SeanceController.getPersonalRecommendationsByActors);
    router.get('/getPersonalRecommendationsByPlaywrights/:id', SeanceController.getPersonalRecommendationsByPlaywrights);
    router.post('/telegram/generate-code', TelegramController.generateCode);

    //-----------------------------------------------------------------------------
;

router.post('/createComment', UserController.createComment);
router.post('/replyComment', UserController.replyToComment);
router.put('/updateComment/:commentId', UserController.updateComment);
router.delete('/deleteComment/:commentId/:userId', UserController.deleteComment);
router.get('/commentstats/:showId', UserController.getCommentsStats);
router.get('/getShowComments/:showId', UserController.getShowComments);
router.get('/getUserComments/:userId', UserController.getUserComments);

module.exports = router;
import {makeAutoObservable} from 'mobx';
import AuthService from '../services/AuthService';
import UserService from '../services/UserService';
import TheatreService from '../services/TheatreService';
import axios from 'axios';
import ShowService from '../services/ShowService';
import SeanceService from '../services/SeanceService';
import TelegramService from '../services/TelegramService';
import { API_URL } from '../http';
export default class Store{
    user;
    isAuth = false;
    isLoading = false;

    poiskPersons = [];
    selectedPoiskPerson = null;
    poiskLoading = false;
    poiskError = null;
    poiskTotalPersons = 0;
    poiskTotalPages = 1;
    poiskSearchParams = {
        query: '',
        page: 1,
        limit: 20,
        profession: [],
        sex: [],
        ageRange: null,
        birthPlace: '',
        sortField: 'name',
        sortType: '1'
    };

    // Константы для фильтров PoiskKino
    poiskProfessions = [
        { value: 'Актер', label: 'Актёр' },
        { value: 'Режиссер', label: 'Режиссёр' },
        { value: 'Продюсер', label: 'Продюсер' },
        { value: 'Сценарист', label: 'Сценарист' },
        { value: 'Оператор', label: 'Оператор' },
        { value: 'Композитор', label: 'Композитор' },
        { value: 'Художник', label: 'Художник' },
    ];

    poiskGenders = [
        { value: 'Мужской', label: 'Мужской' },
        { value: 'Женский', label: 'Женский' },
    ];

    poiskSortFields = [
        { value: 'name', label: 'Имя' },
        { value: 'age', label: 'Возраст' },
        { value: 'countAwards', label: 'Количество наград' },
        { value: 'birthday', label: 'Дата рождения' },
        { value: 'updatedAt', label: 'Дата обновления' },
    ];


    constructor(){
        makeAutoObservable(this);
    }

    setAuth(bool){
        this.isAuth = bool;
    }

    setUser(user){
        this.user = user;
        console.log("User role:", user.role);
    }

    setLoading(bool){
        this.isLoading = bool; 
    }

    async login(email, password){
        try{
            const response = await AuthService.login(email,password);
            localStorage.setItem('token', response.data.accesToken);
            this.setAuth(true);
            this.setUser(response.data.user);
        }catch(err){
                throw err;
        }
    }

    async registration(email, password, name, surname){
        try{
            const response = await AuthService.registration(email,password,name,surname);
            console.log(response);
            localStorage.setItem('token', response.data.accesToken);
            this.setAuth(true);
            this.setUser(response.data.user);
        }catch(err){
                throw err;
        }
    }

    async searchPoiskPersons(params = {}) {
        try {
            this.setPoiskLoading(true);
            this.setPoiskError(null);
            
            // Объединяем текущие параметры с новыми
            const mergedParams = { 
                ...this.poiskSearchParams, 
                ...params,
                page: params.page || this.poiskSearchParams.page
            };
            
            const response = await ShowService.searchPersons(mergedParams);
            
            this.setPoiskPersons(response.data.data || []);
            this.setPoiskTotalPersons(response.data.total || 0);
            this.setPoiskTotalPages(Math.ceil(this.poiskTotalPersons / this.poiskSearchParams.limit));
            
            // Обновляем параметры поиска
            if (params.page) {
                this.setPoiskSearchParam('page', params.page);
            }
            
            return response.data;
        } catch (error) {
            const errorMessage = error.response?.data?.message || 'Ошибка при поиске персон';
            this.setPoiskError(errorMessage);
            throw error;
        } finally {
            this.setPoiskLoading(false);
        }
    }

    // Получение деталей персоны из PoiskKino API
    async getPoiskPersonDetails(id) {
        try {
            this.setPoiskLoading(true);
            const response = await ShowService.getPerson(id);
            this.setSelectedPoiskPerson(response.data.data);
            return response.data;
        } catch (error) {
            const errorMessage = error.response?.data?.message || 'Ошибка при получении данных персоны';
            this.setPoiskError(errorMessage);
            throw error;
        } finally {
            this.setPoiskLoading(false);
        }
    }

    // Обновление параметров поиска PoiskKino
    updatePoiskSearchParams(params) {
        this.poiskSearchParams = { ...this.poiskSearchParams, ...params };
    }

    // Сброс фильтров PoiskKino
    resetPoiskFilters() {
        this.poiskSearchParams = {
            query: '',
            page: 1,
            limit: 20,
            profession: [],
            sex: [],
            ageRange: null,
            birthPlace: '',
            sortField: 'name',
            sortType: '1'
        };
    }

    // Action методы для PoiskKino
    setPoiskPersons(persons) {
        this.poiskPersons = persons;
    }

    setSelectedPoiskPerson(person) {
        this.selectedPoiskPerson = person;
    }

    setPoiskLoading(loading) {
        this.poiskLoading = loading;
    }

    setPoiskError(error) {
        this.poiskError = error;
    }

    setPoiskTotalPersons(total) {
        this.poiskTotalPersons = total;
    }

    setPoiskTotalPages(pages) {
        this.poiskTotalPages = pages;
    }

    setPoiskSearchParam(key, value) {
        this.poiskSearchParams[key] = value;
    }

    // Геттеры для удобства
    get poiskCurrentPage() {
        return this.poiskSearchParams.page;
    }

    get poiskHasNextPage() {
        return this.poiskCurrentPage < this.poiskTotalPages;
    }

    get poiskHasPrevPage() {
        return this.poiskCurrentPage > 1;
    }

    // Метод для перехода на следующую страницу
    async nextPoiskPage() {
        if (this.poiskHasNextPage) {
            await this.searchPoiskPersons({ page: this.poiskCurrentPage + 1 });
        }
    }

    // Метод для перехода на предыдущую страницу
    async prevPoiskPage() {
        if (this.poiskHasPrevPage) {
            await this.searchPoiskPersons({ page: this.poiskCurrentPage - 1 });
        }
    }

    // Метод для поиска с текущими параметрами
    async searchWithCurrentParams() {
        await this.searchPoiskPersons({ page: 1 });
    }

    async addManager(email, password, name, surname, phoneNumber, theatreId,addInfo){
        try{
            const response = await AuthService.addManager(email, password, name, surname, phoneNumber, theatreId,addInfo);
            console.log(response);
          return response.data;
        }catch(err){
                throw err;
        }
    }
    async updateManager(managerId, email, password, name, surname, phoneNumber, theatreId, addInfo){
        try{
            const responce = await AuthService.updateManager(managerId, email, password, name, surname, phoneNumber, theatreId, addInfo);
            return responce.data;

        }catch(err){
            throw err;
        }
    }

    async getManagers(){
        try{
            const responce = await UserService.getManagers();
            return responce.data;

        }catch(err){
            throw err;
        }
    }
    async getManagerByUserId(id){
        try{
            const responce = await AuthService.getManagerByUserId(id);
            return responce.data;
        }catch(err){
            throw err;
        }
    };
    async getUser(id){
        try{
            const responce = await UserService.getUser(id);
            return responce.data;
        }catch(err){
            throw err;
        }
    };


    async deleteManager(id){
        try{
            const responce = await AuthService.deleteManager(id);
            return responce.data;
        }catch(err){
            throw err;
        }
    }

    async logout(){
        try{
            const responce = await AuthService.logout();
            localStorage.removeItem('token');
            this.setAuth(false);
            this.setUser({});
        }catch(err){
                throw err;
        }
    }
    
    async checkAuth(){
        this.setLoading(true);
        try{
            const responce = await axios.get(`${API_URL}/refresh`, {withCredentials:true});
            console.log(responce);
            localStorage.setItem('token', responce.data.accesToken);
            this.setAuth(true);
            this.setUser(responce.data.user);
        }
        catch(err){
            console.log(err.responce?.data?.message);
        }
        finally{
            this.setLoading(false);
        }
    }

    async GetUsers(){
        try{
            const response = await UserService.fetchUsers();
        return response.data;
        }catch(err){
            throw err;
        }
    }

    async getClients(){
        try{
            const response = await UserService.getClients();
        return response.data;
        }catch(err){
            throw err;
        }
    };

    async updateUser(id, password, name, surname){
        try{
            const responce = await UserService.updateUser(id, password, name, surname);
            return responce.data;
        }catch(err){
            throw err;
        }
    }

    async varifyPassword(id, currentPassword){
        try{
            console.log(typeof currentPassword);
            const responce = await UserService.varifyPassword(id, currentPassword);
            return responce.data;
        }catch(err){
            throw err;
        }
    }
    async getRowsByTheatre(theatre_id){
        try{
            const responce = await TheatreService.getRowsByTheatre(theatre_id);
            return responce.data;
        }catch(err){
            throw err;
        }
    }

    async addTheatre(thName, thCity, thAddress,thEmail,thPhone,thDescription, workingHours, latitude, longitude){
        try{
        const responce = await TheatreService.addTheatre(thName, thCity, thAddress,thEmail,thPhone,thDescription, workingHours, latitude, longitude);
        return responce.data;
        }catch(err){
            console.log(err);
        throw err;
        }
    }

    async addSectors(theatre_id, type, from, to, placeCount, priceMarkUp){
        try{
            const responce = await TheatreService.addSector(theatre_id, type, from, to, placeCount, priceMarkUp);
            return responce.data;
        }catch(err){
            console.log(err);
            throw err;
        }
    }

    async deleteSectors(theatre_id, type, from, to){
        try{
            const responce = await TheatreService.deleteSector(theatre_id, type, from, to);
            console.log(type);
            return responce.data;
        }catch(err){
            console.log(err);
            throw err;
        }
    }

    async getTheatres() {
        try {
            const response = await TheatreService.getTheatres();
           
            return response.data;
        } catch (err) {
            throw err; 
        }
    };

    async getTheatreByManager(id){
        try {
            const response = await TheatreService.getTheatreByManager(id);
            return response.data;
        } catch (err) {
            throw err; 
        }
    }

    async getTheatreById(id){
        try{
            const responce = await TheatreService.getTheatreById(id)
            return responce.data;

        }catch(err){
            throw err;
        }
    }
    async updateTheatre(id,thName, thCity, thAddress,thEmail,thPhone,thDescription,workingHours, latitude, longitude){
        try{
            console.log("latitude"+latitude);
            const responce = await TheatreService.updateTheatre(id,thName,thCity, thAddress,thEmail,thPhone,thDescription,workingHours, latitude, longitude);
            return responce.data;
        }catch(err){
            throw err;
        }
    }
    async deleteTheatre(id){
        try{
            const responce = await TheatreService.deleteTheatre(id);
            return responce.data;
        }catch(err){
            throw err;
        }
    }

    async getLastRow(theatre_id, rowType){
         try{
            const responce = await TheatreService.getLastRow(theatre_id, rowType);
            return responce.data;
        }catch(err){
            throw err;
        }
    }

    async getShows(){
        try{
            const response = await ShowService.getShows();
            console.log(response.data);
            return response.data;
        }catch(err){
            throw err;
        }
    }

    async getShowsByManager(manager_user_id){
        try{
            const response = await ShowService.getShowsByManager(manager_user_id);
            console.log(response.data);
            return response.data;
        }catch(err){
            throw err;
        }
    }

    async getShowsWithDetailsById(id){
        try{
            const response = await ShowService.getShowsWithDetailsById(id);
            console.log('responcedata:');
            console.log(response.data);
            return response.data;
        }catch(err){
            throw err;
        }
    }
    async getShowDuration(id){
        try{
            const response = await ShowService.getShowDuration(id);
            return response.data;
        }catch(err){
            throw err;
        }
    }

    
    
    async getShowById(id){
        try{
            const responce = await ShowService.getShowById(id);
            return responce.data;
        }catch(err){
            throw err;
        }
    }
    async getShowsByTheatre(theatre_id){
        try{
            const responce = await ShowService.getShowsByTheatre(theatre_id);
            return responce.data;
        } catch(err){
            throw err;
        }
    }

    async addShow(
    manager_user_id, 
    title, 
    genre, 
    description, 
    rating, 
    theatreId, 
    file, 
    start_price, 
    actorIds = [], 
    roles = [],
    duration = null,
    partsCount = 1,
    ageRestriction = null
) {
    try {
        const response = await ShowService.addShow(
            Number(manager_user_id),
            title, 
            genre, 
            description, 
            rating, 
            theatreId, 
            file, 
            start_price,
            actorIds,
            roles,
            duration,
            partsCount,
            ageRestriction
        );
        console.log(Number(manager_user_id));
        console.log("Шоу добавлено:", response.data);
        return response.data;
    } catch(err) {
        console.error("Ошибка при добавлении шоу:", err);
        throw err;
    }
}

    async updateShow(id,manager_user_id, title, genre, description, theatreId, poster, start_price, actorIds = [], roles = [],duration,partsCount,ageRestriction) {
        try {
            const response = await ShowService.updateShow(
                id, 
                manager_user_id,
                title, 
                genre, 
                description, 
                theatreId, 
                poster, 
                start_price,
                actorIds,
                roles,
                duration,
                partsCount,
                ageRestriction
            );
            return response.data;
        } catch (err) {
            throw err;
        }
    }

    async deleteShow(id, manager_user_id){
        try{
            const responce = ShowService.deleteShow(id, manager_user_id);
            return responce.data;
        }catch(err){
        throw err;
        }
    }

    async addCast(name, surname, photo, description, theatre_id, roleType){
        try{
            console.log("name store: "+ name);
        const responce = await ShowService.addCast(name, surname, photo, description,theatre_id, roleType);
        return responce.data;
        }catch(err){
            throw err;
        }

    }

    async deleteCast(id){
        try{
        const responce = await ShowService.deleteCast(id);
        return responce.data;
        }catch(err){
            throw err;
        }

    }

    async getCast(){
        try{
            const responce = await ShowService.getCast();
            return responce.data;
        }catch(err){
            throw err;
        }
    }

     async getActors(){
        try{
            const responce = await ShowService.getActors();
            return responce.data;
        }catch(err){
            throw err;
        }
    }

    async getShowsByActorId(id){
        try{
            const responce = await ShowService.getShowsByActorId(id);
            return responce.data;
        }catch(err){
            throw err;
        }
    }
    
    async rateShow(userId, showId, userRating){
        try{
             console.log("RATING"+userId+showId+userRating);
            const responce = await ShowService.rateShow(userId, showId, userRating);
           
            return responce.data;
        }catch(err){
            throw err;
        }
    }
    async checkUserRating(userId, showId){
        try{
            const responce = await ShowService.checkUserRating(userId, showId);
            return responce.data;
        }catch(err){
            throw err;
        }
    }

    async getSeances(){
        try{
            const responce = await SeanceService.getSeances();
            return responce.data;
        }catch(err){
            throw err;
        }
    }

    async userHasTicketForSeance(userId, seanceId){
        try{
            const responce = await SeanceService.userHasTicketForSeance(userId, seanceId);
            return responce.data;

        }catch(err){
            throw err;
        }
    }

    async getSeanceById(id){
        try{
            const responce = await SeanceService.getSeanceById(id);
            return responce.data;
        }catch(err){
            throw err;
        }
    }

    async getSeanceByTheatre(id){
        try{
            const responce = await SeanceService.getSeanceByTheatre(id);
            return responce.data;
        }catch(err){
            throw err;
        }
    }

    async getSeanceByDate(date){
        try{
            const responce = await SeanceService.getSeanceByDate(date);
            return responce.data;
        }catch(err){
            throw err;
        }
    }

    async getSeancesWithDetails(){
        try{
            const responce = await SeanceService.getSeancesWithDetails();
            return responce;
        }catch(err){
            throw err;
        }
    };
    
    async getSeancesByTheatre(id){
        try{
            const responce = await SeanceService.getSeancesByTheatre(id);
            return responce;
        }catch(err){
            throw err;
        }
    };

    async getTicketsByClientId(id){
        try{
            const responce = await SeanceService.getTicketsByClientId(id);
            console.log(responce.data);
            return responce.data || [];
        }catch(err){
            throw err;
        }
    }
    async canselSeance(id, manager_user_id){
        try{
            const responce = await SeanceService.canselSeance(id, manager_user_id);
            console.log(responce.data);
            return responce.data || [];
        }catch(err){
            throw err;
        }
    };

    async deleteTicket(id){
        try{
            const responce = await SeanceService.deleteTicket(id);
            console.log(responce.data);
            return responce.data || [];
        }catch(err){
            throw err;
        }
    }

    async getMaxPrice(id){
        try{
        const responce = await SeanceService.getMaxPrice(id);
        console.log("resp"+responce.data);
        return responce.data;
        }catch(err){
            throw err;
        }
    }

    async getMinPrice(id){
        try{
        const responce = await SeanceService.getMinPrice(id);
        console.log("resp"+responce.data);
        return responce.data;
        }catch(err){
            throw err;
        }
    }
    

    async addSeance(theatre_id,manager_user_id, show_id, start_time, end_time, status){
        try{
            const response = await SeanceService.addSeance(theatre_id,manager_user_id, show_id, start_time, end_time, status);
            return response.data;
        }catch(err){
            throw err;
        }
    }

    async updateSeance(seance_id,manager_user_id, theatre_id, show_id, start_time, end_time, status){
        try{
            const response = await SeanceService.updateSeance(seance_id,manager_user_id, theatre_id, show_id, start_time, end_time, status);
            return response.data;
        }catch(err){
            throw err;
        }
    }

    async deleteSeance(id, manager_user_id){
        try{
            const response = await SeanceService.deleteSeance(id, manager_user_id);
            return response.data;
        }catch(err){
            throw err;
        }
    }

    async getTicket(seance_id, seat_id, user_id){
        try{
            const response = await SeanceService.getTicket(seance_id, seat_id, user_id);
            return response.data;
        }catch(err){
            throw err;
        }
    }

    async getPersonalRecommendations(id){
        try{
            const response = await SeanceService.getPersonalRecommendations(id);
            return response.data;
        }catch(err){
            throw err;
        }
    }

    async getPersonalRecommendationsByActors(id){
        try{
            const response = await SeanceService.getPersonalRecommendationsByActors(id);
            return response.data;
        }catch(err){
            throw err;
        }
    }
    async getPersonalRecommendationsByPlaywrights(id){
        try{
            const response = await SeanceService.getPersonalRecommendationsByPlaywrights(id);
            return response.data;
        }catch(err){
            throw err;
        }
    }

    async getStatus(seance_id){
        try{
            const response = await SeanceService.getStatus(seance_id);
            return response.data;
        }catch(err){
            throw err;
        }
    }

    async getTicketsWithDetails(){
        try{
            const response = await SeanceService.getTicketsWithDetails();
            return response.data;
        }catch(err){
            throw err;
        }
        }

     async getTicketsWithDetailsByTh(id){
        try{
            const response = await SeanceService.getTicketsWithDetailsByTh(id);
            return response.data;
        }catch(err){
            throw err;
        }
    };

    async generatecode(id){
        try{
            const response = await TelegramService.generatecode(Number(id));
            console.log(id);
            return response.data;
        }catch(err){
            throw err;
        }
    }

    async createComment(userId,showId, content, rating = null){
    try{
        const response = await UserService.createComment(userId,showId, content, rating);
        return response.data;
    }catch(err){
        throw err;
    }
}

async replyComment(userId,parentCommentId, content){
    try{
        console.log("REPLY DATA"+ JSON.stringify(content));
        const response = await UserService.replyComment(userId,parentCommentId, content);
        return response.data;
    }catch(err){
        throw err;
    }
}

async getShowComments(showId){
    try{
        const response = await UserService.getShowComments(showId);
        console.log("SHOW ID:" + JSON.stringify(response));
        return response.data;
    }catch(err){
        throw err;
    }
}

async getUserComments(userId){
    try{
        const response = await UserService.getUserComments(userId);
        return response.data;
    }catch(err){
        throw err;
    }
}

async updateComment(commentId, userId,content){
    try{
        const response = await UserService.updateComment(commentId, userId,content);
        console.log("EDETED TEXT"+ JSON.stringify(response));
        return response.data;
    }catch(err){
        throw err;
    }
}

async deleteComment(userId,commentId){
    try{
        const response = await UserService.deleteComment(userId,commentId);
        return response.data;
    }catch(err){
        throw err;
    }
}

async getCommentsStats(showId){
    try{
        const response = await UserService.getCommentsStats(showId);
        return response.data;
    }catch(err){
        throw err;
    }
};
async getShowComments(showId){
    try{
        const response = await UserService.getShowComments(showId);
        return response.data;
    }catch(err){
        throw err;
    }
};




    

}
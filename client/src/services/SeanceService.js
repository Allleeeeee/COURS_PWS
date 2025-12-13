import $api from "../http"

export default class SeanceService{

    static async addSeance(theatre_id,manager_user_id, show_id, start_time, end_time, status){
        return $api.post('/addSeance', {theatre_id,manager_user_id, show_id, start_time, end_time, status});
    }

    static async updateSeance(seance_id,manager_user_id, theatre_id, show_id, start_time, end_time, status){
        return $api.put('/updateSeance', {seance_id,manager_user_id, theatre_id, show_id, start_time, end_time, status});
    }

    static async deleteSeance(id, manager_user_id){
        return $api.delete(`/deleteSeance/${id}/${manager_user_id}`);
    }
    static async canselSeance(id, manager_user_id){
        return $api.put(`/canselSeance/${id}/${manager_user_id}`);
    };

    static async getSeances(){
        return $api.get('/getSeances');
    }
    static async getPersonalRecommendations(id){
        return $api.get(`/getPersonalRecommendations/${id}`);
    }
    static async getPersonalRecommendationsByActors(id){
        return $api.get(`/getPersonalRecommendationsByActors/${id}`);
    }
    static async getPersonalRecommendationsByPlaywrights(id){
        return $api.get(`/getPersonalRecommendationsByPlaywrights/${id}`);
    }
    static async getSeanceById(id){
        return $api.get(`/getSeance/${id}`);
    }
    static async getSeanceByTheatre(id){
        return $api.get(`/getSeanceByTheatre/${id}`);
    }
    static async getSeanceByDate(date){
        return $api.get('/getSeanceByDate',{date});
    }

    static async getSeancesWithDetails(){
        return $api.get('/getSeancesWithDetails');
    }
    static async getMaxPrice(id){
        return $api.get(`/getMaxPrice/${id}`);
    }
    static async getMinPrice(id){
        return $api.get(`/getMinPrice/${id}`);
    }
    static async getTicket(id, seat_id, user_id){
        return $api.post(`/getTicket/${id}`, {seat_id, user_id});
    }
    static async getStatus(id){
        return $api.get(`/getStatus/${id}`);
    }
    static async getSeancesByTheatre(id){
        return $api.get(`/getSeancesByTheatre/${id}`);
    }
    static async getTicketsByClientId(id){
        return $api.get(`/getTicketsByClientId/${id}`);
    }
    static async deleteTicket(id){
        return $api.delete(`/deleteTicket/${id}`);
    }

    static async getTicketsWithDetails(){
        return $api.get(`/getTicketsWithDetails`);
    }
    static async getTicketsWithDetailsByTh(id){
        console.log("id teatre" + id);
        return $api.get(`/getTicketsWithDetails/${id}`);
    }
    static async userHasTicketForSeance(userId, seanceId){
        return $api.get(`/userHasTicketForSeance/${userId}/${seanceId}`);
    }

}
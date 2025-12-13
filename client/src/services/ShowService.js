import $api from "../http"

export default class ShowService{

    static async getShows(){
      return $api.get('/getShows');
    }
    static async getShowsByManager(manager_user_id){
      return $api.get(`/getShowsByManager/${manager_user_id}`);
    }

    static async getShowsWithDetailsById(id){
      return $api.get(`/getShowsWithDetailsById/${id}`);
    }
    static async getShowDuration(id){
      return $api.get(`/getShowDuration/${id}`);
    }

    static async getShowById(id){
      return $api.get(`/getShowById/${id}`);
    }
    static async getShowsByTheatre(theatre_id){
      return $api.get(`/getShowsByTheatre/${theatre_id}`);
    } 

    static async addShow(
    manager_user_id, 
    title, 
    genre, 
    description, 
    rating, 
    theatreId, 
    poster, 
    start_price, 
    actorIds = [], 
    roles = [],
    duration = null,
    partsCount = 1,
    ageRestriction = null
) {
    const formData = new FormData();
    formData.append("manager_user_id", manager_user_id);
    formData.append("title", title);
    formData.append("genre", genre);
    formData.append("description", description);
    formData.append("rating", rating); 
    formData.append("theatreId", theatreId);
    formData.append("poster", poster);
    formData.append("start_price", start_price);
    
    // Добавляем новые поля
    if (duration !== null) {
        formData.append("duration", duration);
    }
    
    formData.append("partsCount", partsCount);
    
    if (ageRestriction !== null) {
        formData.append("ageRestriction", ageRestriction);
    }
    
    // Добавляем актеров и роли
    if (actorIds.length > 0) {
        formData.append("actorIds", Array.isArray(actorIds) ? actorIds.join(',') : actorIds);
        formData.append("roles", Array.isArray(roles) ? roles.join(',') : roles);
    }

    return $api.post("/addShow", formData, {
        headers: { "Content-Type": "multipart/form-data" },
    });
}

  static async updateShow(id,manager_user_id, title, genre, description, theatreId, poster, start_price, actorIds =[], roles =[],duration,partsCount,ageRestriction) {
    const formData = new FormData();
  
    formData.append('id', id);
    formData.append("manager_user_id", manager_user_id);
    formData.append('title', title);
    formData.append('genre', genre);
    formData.append('description', description);
    formData.append('theatreId', theatreId);
    formData.append('start_price', start_price);
    formData.append('duration', duration);
    formData.append('partsCount', partsCount);
    formData.append('ageRestriction', ageRestriction);
    
    if (actorIds.length > 0) {
      formData.append("actorIds", Array.isArray(actorIds) ? actorIds.join(',') : actorIds);
      formData.append("roles", Array.isArray(roles) ? roles.join(',') : roles);
  }

    if (poster) {
        formData.append("poster", poster);
    }

    return $api.put("/updateShow", formData, {
        headers: { "Content-Type": "multipart/form-data" },
    });
};

static async deleteShow(id, manager_user_id){
  return $api.delete(`/deleteShow/${id}/${manager_user_id}`);
};

 static async getCast(actorId = null) {
  return $api.get(actorId ? `/getCast/${actorId}` : '/getCast');
}

static async getActors(actorId = null) {
  return $api.get(actorId ? `/getActors/${actorId}` : '/getActors');
}

  static async rateShow(userId, showId, userRating){
    return $api.post('/rateShow', {userId, showId, userRating})
  }

  static async checkUserRating(userId, showId){
    return $api.post('/checkUserRating', {userId, showId})
  }

  static async getShowsByActorId(id){
    return $api.get(`/actors/${id}/shows`);
  }
  static async addCast(name, surname, photo, description,theatre_id, roleType) {
    const formData = new FormData();
    formData.append('name', name);
    formData.append('surname', surname);
    formData.append('description', description);
    formData.append('theatre_id', theatre_id);
    formData.append('roleType', roleType);
    formData.append('photo', photo); 
    
    return $api.post("/addCast", formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  };

  static async deleteCast(id){
    return $api.delete(`/deleteCast/${id}`);
  };

   static async searchPersons(params = {}) {
        return $api.get('/external-api/persons/search', { params });
    }

    static async getPerson(id) {
        return $api.get(`/external-api/persons/${id}`);
    }

}
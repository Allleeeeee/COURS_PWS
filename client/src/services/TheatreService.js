import $api from "../http"

export default class TheatreService{
    static async addTheatre(thName, thCity, thAddress,thEmail,thPhone,thDescription, workingHours, latitude, longitude){
        return $api.post('/addTheatre', {thName,thCity, thAddress,thEmail,thPhone,thDescription, workingHours, latitude, longitude})
    };

    static async addSector(theatre_id, type, from, to, placeCount, priceMarkUp){
        return $api.post('/addTheatre/addSector', {theatre_id, type, from, to, placeCount, priceMarkUp})
    }
    static async deleteSector(theatre_id, type, from, to){
        console.log(type);
        return $api.post('/addTheatre/deleteSector', {theatre_id, type, from, to})
    }

    static async getTheatres(){
        return $api.get('/getTheatres');
    };
    static async getTheatreById(id){
        return $api.get(`/getTheatre/${id}`);
    };

    static async updateTheatre(id,thName, thCity, thAddress,thEmail,thPhone,thDescription,workingHours, latitude, longitude){
        return $api.put('/updateTheatre',{id,thName,thCity, thAddress,thEmail,thPhone,thDescription,workingHours, latitude, longitude});
    }
    static async deleteTheatre(id){
        return $api.delete(`/delTheatre/${id}`);
    }
    static async getRowsByTheatre(theatre_id){
        return $api.get(`/getRowsByTheatre/${theatre_id}`);
    }
    static async getTheatreByManager(id){
        return $api.get(`/getTheatreByManager/${id}`)
    }
    static async getLastRow(theatre_id, rowType){
        return $api.post(`/getLastRow`, {theatre_id, rowType})
    }

}
import $api from "../http"

export default class AuthService{
    
    static async login (email, password){
        return $api.post('/login', {email, password})
        
    }

    static async registration (email, password,name, surname){
        return $api.post('/registration', {email, password, name,surname })
        
    }

    static async logout (){
        return $api.post('/logout')
        
    }
    static async addManager(email, password, name, surname, phoneNumber, theatreId,addInfo){
        return $api.post('/addManager',{email, password, name, surname, phoneNumber, theatreId,addInfo});
    }

    static async deleteManager(id){
        return $api.delete(`/deleteManager/${id}`);
    }
    static async updateManager(managerId, email, password, name, surname, phoneNumber, theatreId, addInfo){
        return $api.put("/updateManager", {managerId, email, password, name, surname, phoneNumber, theatreId, addInfo});
    }
    static async getManagerByUserId(id){
        return $api.get(`/getManagerByUserId/${id}`);
    }
}
import $api from "../http"

export default class TelegramService{
    static async generatecode(id){
        console.log(id);
        return $api.post('/telegram/generate-code', {id})
    };
};
import $api from "../http"
export default class UserService{
    
    static fetchUsers (){
        return $api.get('/users')
        
    }
    static getManagers(){
        return $api.get('/getManagers');
    }
    static getUser(id){
        return $api.get(`/user/${id}`);
    }
    static updateUser(id, password, name, surname){
        return $api.put(`/updateUser/${id}`,{password, name, surname});
    }
    static varifyPassword(id, currentPassword){
        return $api.post(`/varifyPassword/${id}`,{currentPassword});
    }
    static getClients(){
        return $api.get('/clients');
    }
    static createComment(userId,showId, content, rating = null) {
        return $api.post('/createComment', {userId,showId,content,rating});
    }

    // Ответить на существующий комментарий
    static replyComment(userId,parentCommentId, content) {
        return $api.post('/replyComment', {
            userId,
            parentCommentId,
            content
        });
    }

    // Получить все комментарии спектакля
    static getShowComments(showId) {
        return $api.get(`/showComment/${showId}`);
    }
    static getUserComments(userId) {
        return $api.get(`/getUserComments/${userId}`);
    }

    // Редактировать комментарий
    static updateComment(userId,commentId, content) {
        return $api.put(`/updateComment/${commentId}`, {
            userId,
            content
        });
    }

    // Удалить комментарий
    static deleteComment(userId,commentId) {
        return $api.delete(`/deleteComment/${commentId}/${userId}`);
    }

    // Получить статистику комментариев для спектакля
    static getCommentsStats(showId) {
        return $api.get(`/commentstats/${showId}`);
    }

    static getShowComments(showId) {
        return $api.get(`/getShowComments/${showId}`);
    }

}
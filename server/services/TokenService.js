const jwt = require('jsonwebtoken');
const {Theatres, Rows, Seats,Users, TokenShemes, Managers, Cast, Show, Show_Cast, Seance, Ticket} = require("../models/models.js")


class TokenService {
    generateToken(payload){
        const accesToken = jwt.sign(payload, process.env.JWT_ACCESS_SECRET,{expiresIn:'30m'} );
        const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET,{expiresIn:'60d'} );
        return{
            accesToken,
            refreshToken
        }
        
    };
    validateAccessToken(token){

        try{
            const userData = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
            return userData;

        }
        catch(err){
            return null;
        }
    }

    validateRefreshToken(token){

        try{
            const userData = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
            console.log(userData);
            return userData;
        }
        catch(err){
            return null;
        }
    }

   async saveToken(userId, refreshToken,  userAgent = '', ip = '') {
        const token = await TokenShemes.create({
        User_id: userId,
        RefreshToken: refreshToken,
        UserAgent: userAgent,
        IP: ip
    });
    
    return token;
}

    async removeToken(refreshToken){
        const tokenData = await TokenShemes.destroy({where:{RefreshToken:refreshToken}});
        return tokenData;
    }

    async findToken(refreshToken){
        const tokenData = await TokenShemes.findOne({where:{RefreshToken:refreshToken}});
        return tokenData;
    }
}

module.exports = new TokenService();
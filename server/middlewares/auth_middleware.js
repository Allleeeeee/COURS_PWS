const ApiError = require('../exceptions/apierror')
const TokenService = require('../services/TokenService');
module.exports = function(roles = []) {
    return function(req, res, next) {
        try {
            const authorizationHeader = req.headers.authorization;
            if (!authorizationHeader) {
                return next(ApiError.UnautorizedError());
            }

            const accessToken = authorizationHeader.split(' ')[1];
            if (!accessToken) {
                return next(ApiError.UnautorizedError());
            }

            const userData = TokenService.validateAccessToken(accessToken);
            if (!userData) {
                return next(ApiError.UnautorizedError());
            }

            if (roles.length && !roles.includes(userData.role)) {
                return next(ApiError.ForbiddenError());
            }

            req.user = userData;
            next();
        } catch(err) {
            return next(ApiError.UnautorizedError());
        }
    }
}
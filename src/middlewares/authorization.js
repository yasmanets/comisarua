'use strict'

const tokenService = require('../services/Token');
const logger = require('../services/Logger');

exports.authorize = (roles = [], token = '') => {
    if (typeof roles === 'string') {
        roles = [roles];
    }

    return [
        async (req, res, next) => {
            const errors = [];
            token = req.headers.authorization ? req.headers.authorization : '';
          
            if (!token) {
                logger.warn(`authorize: the token isn't in the request`);
                errors.push({ message: 'Debes iniciar sesión para acceder a la página. '});
                return res.status(401).render('users/login', { errors });
            }

            token = token.replace('Bearer', '');
            try {
                req.user = await tokenService.decodeToken(token);
            }
            catch(error) {
                logger.warn(`authorize: decodeToken error: ${error}`);
                errors.push({ message: 'Se ha producido un error al comprobar tu sesión. Por favor inicia sesión de nuevo. '});
                return res.status(500).render('users/login', { errors });
            }

            if (!req.user) {
                logger.error(`authorize: user not found`);
                return res.status(401).send({ message: 'You are not authorized to perform this action' });
            }
            
            if (roles.length && !roles.includes(req.user.role)) {
                logger.warn(`authorize: the user ${req.user._id} doesn't have permission ${req.user.role}`);
                errors.push({ message: 'No tienes permisos suficientes para realizar está acción '});
                return res.status(401).render('users/login', { errors });
            }
            return next();
        }
    ];
}

exports.hasSession = async (req, res) => {
    if (req.url.includes("/forgotPassword") || (req.url.includes("/userRegister") && !req.query.from)) {
        return res.status(200).send({message: 'Authorized'});
    }
    let token = req.headers.authorization;
    if (!token) {
        return res.status(401).end();
    }
    token = token.replace('Bearer', '');
    try {
        await authService.DecodeToken(token);
        return res.status(200).send({message: 'Authorized'});
    }
    catch(error) {
        logger.warn(`hasSession: DecodeToken error: ${error}`);
        return res.status(401).end();
    }
}

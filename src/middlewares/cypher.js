'use strict'

const utilities = require('../utils/utils');
const logger = require('../services/Logger');

const cryptoMiddleware = {
    async encryptPassword (req, res, next) {
        const params = req.body;
        let password;
        try {
            password = await utilities.generatePBKDF(params.password);
        }
        catch (error) {
            logger.error(`encryptPassword: ${error}`);
            //return res.status(500).render('polices/register', { message: 'Se ha producido un error al cifrar la contraseña' });
        }
        params.password = password;
        req.body = params;
        return next();
    },

    async generateKeyPair(req, res, next) {
        const params = req.body;
        try {
            await utilities.generateKeys(params.username, params.password);
        }
        catch (error) {
            logger.error(`generateKeyPair: ${error}`);
            return next();
        }
    }
}

module.exports = cryptoMiddleware;

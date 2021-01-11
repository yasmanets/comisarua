'use strict'

const utilities = require('../utils/utils');
const logger = require('../services/Logger');
const crypto = require('crypto');
const path = require('path');
const userModel = require('../models/user.model');

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
    },

    async createSignature (req, res, next) {
        const file = req.fileContent;
        let user = req.user;
        const document = req.document;
        const hash = crypto.createHash('sha512').update(file).digest('hex');
        try {
            user = await userModel.findById(user._id);
        }
        catch (error) {
            logger.error(`POST /createSignature: ${error}`);
        }
        let privateKey;
        try {
            privateKey = await utilities.getFile(path.join(__dirname, `${process.env.PR_PATH}/${user.username}.pem`));
        }
        catch (error) {
            logger.error(`POST /createSignature: ${error}`);
        }
        privateKey = utilities.decryptPrivateKey(privateKey.toString('utf-8'), user);
        document.signature = crypto.privateEncrypt({
            key: privateKey,
            passphrase: user.password,
        }, Buffer.from(hash, 'hex')).toString('hex');
        try {
            await document.save();
        }
        catch (error) {
            logger.error(`POST /createSignature: ${error}`);
        }
        logger.error(`POST /createSignature: document ${document._id} signed: ${document.signature}`);
        return;
    }
}

module.exports = cryptoMiddleware;

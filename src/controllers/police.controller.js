'use strict'

const UserModel = require('../models/user.model');
const logger = require('../services/Logger');
const C = require('../utils/constants');

const policeController = {
    newPoliceForm(req, res) {
        return res.status(200).render('polices/register');
    },

    async newPolice(req, res, next) {
        const params = req.body;
        const user = new UserModel();
        user.username = params.username;
        user.password = params.password;
        user.role = params.role;
        try {
            await user.save();
        }
        catch (error) {
            const errors = [];
            logger.error(`POST /newPolice: ${error}`);
            const message = error.code === C.DUPLICATE_KEY ? 'El nombre de usuario ya está registrado en el sistema.' : 'Se ha producido un error al guardar los datos del usuario';
            errors.push({ message });
            return res.status(500).render('polices/register', { errors });
        }
        logger.info(`POST /newPolice: ${user._id}`);
        req.flash('success', 'Policia registrado con éxito');
        res.status(200).redirect('/')
        return next();
    }
}

module.exports = policeController;

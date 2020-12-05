'use strict'

const UserModel = require('../models/user.model');
const logger = require('../services/Logger');
const utilities = require('../utils/utils');
const tokenService = require('../services/Token');

const indexController = {
    index (req, res) {
        return res.status(200).render('index');
    },

    loginForm (req, res) {
        return res.status(200).render('users/login');
    },

    async login (req, res) {
        const errors = [];
        const params = req.body;
        let user;
        try {
            user = await UserModel.findOne({username: params.username}).limit(1);
        }
        catch (error) {
            logger.error(`POST /login: ${error}`);
            errors.push({ message: 'Se ha producido un error al guardar los datos del usuario' });
            return res.status(500).render('users/login', { errors });
        }
        if (!user) {
            logger.warn(`POST /login: ${params.username} not found`);
            errors.push({ message: 'El nombre de usuario no está registrado en el sistema.' });
            return res.status(400).render('users/login', { errors });
        }
        let password;
        try {
            password = await utilities.generatePBKDF(params.password);
        }
        catch (error) {
            logger.error(`POST /login: ${error}`);
            errors.push({ message: 'Se ha producido un error al procesar la petición.' })
            return res.status(500).render('users/login', { errors });
        }
        if (password !== user.password) {
            logger.warn(`POST /login: the password of the user ${user.id} is not valid`);
            errors.push({ message: 'La contraseña introducida no es válida. Por favor, inténtalo de nuevo.' })
            return res.status(403).render('users/login', { errors });
        }
        const token = tokenService.createToken(user);
        logger.info(`POST /login: ${user.id} logged`);
        req.flash('success', 'Se ha iniciado sesión con éxito.');
        req.session.token = token;
        req.session.role = user.role
        return res.status(200).redirect('/');
    },
}

module.exports = indexController;

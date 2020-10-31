'use strict'

const connection = require('../database/connection');
const userModel = require('../models/user.model');
const logger = require('../services/Logger');
const utilities = require('../utils/utils');

const indexController = {
    index (req, res) {
        return res.status(200).render('index');
    },

    loginForm (req, res) {
        return res.status(200).render('users/login');
    },

    login (req, res) {
        const params = req.body;
        const sql = 'SELECT * FROM `users`';
        const where = 'WHERE `identificationNumber` = ?';
        const data = [ params.identificationNumber ];
        const errors = [];
        connection.database.select(sql, where, data)
            .then(async (row) => {
                if  (row.length !== 1 || row[0].identificationNumber.toString() !== params.identificationNumber) {
                    logger.warn(`POST /login: ${params.identificationNumber} not found`);
                    errors.push({ message: 'El usuario no está registrado en el sistema.'});
                    return res.status(404).render('users/login', { errors });
                }
                const user = new userModel(row[0]);
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
                logger.info(`POST /login: ${user.id} logged`);
                req.flash('success', 'Se ha iniciado sesión con éxito.');
                return res.status(200).redirect('/');
            })
            .catch((error) => {
                logger.error(`POST /login: ${params.identificationNumber}, ${error}`);
                errors.push({ message: 'Se ha producido un error al iniciar sesión. Por favor, inténtalo de nuevo.' });
                return res.status(500).render('users/login', { errors });
            });

    },
}

module.exports = indexController;

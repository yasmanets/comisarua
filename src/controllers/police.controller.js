'use strict'

const logger = require('../services/Logger');
const { database } = require('../database/connection');
const C = require('../utils/constants');

const policeController = {
    newPoliceForm(req, res) {
        return res.status(200).render('polices/register');
    },

    async newPolice(req, res, next) {
        const params = req.body;
        const sql = 'INSERT INTO `users` (name, surnames, identificationNumber, password, roleId, phone, studies, salary, entryDate, departureDate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
        const data = [`${params.name}`, `${params.surname}`, `${params.identificationNumber}`, `${params.password}`, `2`, `${params.phone}+`, `${params.studies}`, `${params.salary}`, null, null];
        database.insert(sql, data)
            .then((row) => {
                logger.info(`POST /newPolice: ${row} added`);
                req.flash('success', 'Policia registrado con éxito');
                return res.status(200).redirect('/')
            })
            .catch ((error) => {
                const errors = [];
                logger.error(`POST /newPolice: ${error}`);
                const message = error.code === C.DUPLICATE_KEY ? 'Ya existe un policia con la misma identificación' : 'Se ha producido un error al registrar al nuevo policia.';
                errors.push({ message });
                res.status(500).render('polices/register', { errors });
            });
    }
}

module.exports = policeController;

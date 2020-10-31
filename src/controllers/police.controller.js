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
        const sql = 'INSERT INTO `users` (name, surnames, identificationNumber, password, role, phone, studies, salary, entryDate, departureDate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
        const data = [`${params.name}`, `${params.surname}`, `${params.identificationNumber}`, `${params.password}`, `police`, `${params.phone}+`, `${params.studies}`, `${params.salary}`, null, null];
        database.insert(sql, data)
            .then((row) => {
                req.flash('success', 'Policia registrado con éxito');
                return res.status(200).redirect('/')
            })
            .catch ((error) => {
                logger.error(`POST /newPolice: ${error}`);
                const message = error.code === C.DUPLICATE_KEY ? 'Ya existe un policia con la misma identificación' : 'Se ha producido un error al registrar al nuevo policia.';
                req.flash('error', message)
                res.status(500).redirect('/')
            });
    }
}

module.exports = policeController;

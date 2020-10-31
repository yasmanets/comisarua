'use strict'

const logger = require('../services/Logger');
const { database } = require('../database/connection');

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
                console.log(row);
            })
            .catch ((error) => {
                logger.error(`POST /newPolice: ${error}`);
                return res.status(500).send({message: 'Se ha producido un error al registrar al nuevo policia'});
            });
    }
}

module.exports = policeController;

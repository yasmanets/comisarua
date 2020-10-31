'use strict'

const connection = require('../database/connection');

const indexController = {
    index (req, res) {
        return res.status(200).render('index');
    },

    loginForm (req, res) {
        return res.status(200).render('users/login');
    },

    login (req, res) {
        console.log(req.body)
    }
}

module.exports = indexController;

'use strict'

const mysql = require('mysql2');
const logger = require('../services/Logger');

const pool = mysql.createPool({
    host: `${process.env.HOST}`,
    user: `${process.env.DB_USER}`,
    password: `${process.env.DB_PASSWORD}`,
    database: `${process.env.DATABASE}`,
    port: `${process.env.DB_PORT}`,
    waitForConnections: true
});

pool.getConnection((error) => {
    if (error) {
        logger.error(`getConnection: ${error}`);
        throw new Error(`Getting the connection to the database`);
    }
    logger.info(`Successful connection`);
});

const database = {
    insert(sql, data) {
        return new Promise((resolve, reject) => {
            pool.query(sql, data, (error, result) => {
                if (error) {
                    reject(error);
                }
                else {
                    resolve(result.insertId);
                }
            });
        });
    },
}

module.exports = {
    pool,
    database
}

'use strict'
const path = require('path')
const result = require('dotenv').config({path: path.resolve(__dirname, '../.env')});

if (result.error) {
    throw result.error;
}

const logger = require('./services/Logger');
const app = require('./app');
const port = process.env.PORT || 4200

app.listen(port, () => {
    logger.info(`comisarua is listening on port ${port}`);
});

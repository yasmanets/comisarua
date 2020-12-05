'use strict'
const path = require('path')
const result = require('dotenv').config({path: path.resolve(__dirname, '../.env')});

if (result.error) {
    throw result.error;
}

const mongoose = require('mongoose');
const logger = require('./services/Logger');
const app = require('./app');
const port = process.env.PORT || 4200
const C = require('./utils/constants')

//  Se desactivan los métodos deprecados
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);
mongoose.Promise = global.Promise;
let connection = `mongodb://${process.env.MONGO_USER}:${process.env.MONGO_PWD}@${process.env.MONGO_SERVER}/${process.env.MONGO_DB}`;
if (process.env.NODE_ENV === C.DEVELOPMENT) {
    connection = `mongodb://${process.env.MONGO_SERVER}/${process.env.MONGO_DB}`;
}
mongoose.connect(connection, {useNewUrlParser:true, useUnifiedTopology: true})
    .then(() =>{
        logger.info(`${connection} successful`);
        app.listen(port, () => {
            logger.info(`comisarua is listening on port ${port}`);
        })
    })
    .catch(error => {
        logger.error(`connection not established ${connection}: ${error}`);
    })

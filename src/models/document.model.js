'use strict'

var mongoose = require('mongoose')
var Schema = mongoose.Schema;

const DocumentSchema = Schema({
    title: { type: String, required: true},
    access: [
        { userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }},
        { key: { type: String, required: true }}
    ],
});

module.exports = mongoose.model('User', UserSchema);
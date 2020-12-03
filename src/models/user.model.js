'use strict'

var mongoose = require('mongoose')
var Schema = mongoose.Schema;

const UserSchema = Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true},
    role: {type: String, default: "police"},
    info: { type: String, required: false },
    documentId: {type: mongoose.Schema.Types.ObjectId, ref: 'Client'},
});

module.exports = mongoose.model('User', UserSchema);
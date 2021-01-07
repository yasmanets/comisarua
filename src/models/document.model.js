'use strict'

var mongoose = require('mongoose')
var Schema = mongoose.Schema;

const DocumentSchema = Schema({
    title: { type: String, required: true},
    type: { type: String, required: true},
    access: [{
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        key: { type: String, required: true }
    }],
    publisher: { type: String, required: false },
    signature: { type: String, required: false },
});

module.exports = mongoose.model('Document', DocumentSchema);
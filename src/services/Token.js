'use strict'

const jwt = require('jsonwebtoken');
const expirationTime = 60 * 60 * 8; // 60secs * 60 mins = 1h * 8 = 8h

exports.createToken = function (user) {
    const payload = {
        _id: user._id,
        username: user.username,
        role: user.role,

    }
    const expiresIn = expirationTime
    return jwt.sign(payload, process.env.TOKEN_SECRET, {expiresIn: expiresIn});
}

exports.decodeToken = function (token) {
    const invalid = 'invalid token';
    const expired = 'jwt expired';

    const decoded = new Promise((resolve, reject) => {
        try {
            jwt.verify(token, process.env.TOKEN_SECRET, (error, payload) => {
                if (error) {
                    if (error.message === expired) {
                        throw new Error('El token ha expirado');
                    } else if (error.message === invalid) {
                        throw new Error('El token es inválido');
                    }
                }
                resolve(payload);
            });
        }
        catch(error) {
            reject(new Error(error.message));
        }
    });
    //  Se devuelve la promesa
    return decoded;
}
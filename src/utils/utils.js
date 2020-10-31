'use strict'

const crypto = require('crypto');
const util = require('util');
const pbkdf2 = util.promisify(crypto.pbkdf2);

module.exports = {
    async generatePBKDF (password) {
        const passwordHash = crypto.createHash('sha256').update(password).digest('hex');
        const seed = passwordHash.substring(0, passwordHash.length / 2);
        let pbkdf;
        try {
            pbkdf = await pbkdf2(password, seed, 10, 128, 'sha512');
        }
        catch (error) {
            throw new Error(`generatePBKDF: ${error}`);
        }
        return pbkdf.toString('hex');
    },
}

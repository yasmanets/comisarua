'use strict'

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const util = require('util');
const pbkdf2 = util.promisify(crypto.pbkdf2);
const generateKeyPair = util.promisify(crypto.generateKeyPair);
const writeFile = util.promisify(fs.writeFile);
const C = require('../utils/constants');

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

    async generateKeys (username, password) {
        let keys;
        try {
            keys = await generateKeyPair('rsa', { 
                modulusLength: 1024,
                publicKeyEncoding: {
                    type: 'spki',
                    format: 'pem',
                },
                privateKeyEncoding: {
                    type: 'pkcs8', 
                    format: 'pem', 
                    cipher: 'aes-256-cbc',
                    passphrase: password
                }
            });
        }
        catch (error) {
            throw new Error(`generateKeys: ${error}`);
        }
        try {
            const privateKey = encryptKey(keys.privateKey, password);
            await this.saveFiles(username.toLowerCase(), process.env.PR_PATH, '.pem', privateKey)
        }
        catch (error) {
            throw new Error(`generateKeys: ${error}`);
        }
        try {
            await this.saveFiles(username.toLowerCase(), process.env.PB_PATH, '.pub', keys.publicKey)
        }
        catch (error) {
            throw new Error(`generateKeys: ${error}`);
        }
    },

    async saveFiles (fileName, storePath, extension, content) {
        const filePath = path.join(__dirname, storePath);
        try {
            await writeFile(filePath + `/${fileName}${extension}`, content);
        }
        catch (error) {
            throw new Error(`saveFiles: ${error}`);
        }
    }
}

function encryptKey(key, password) {
    const iv = crypto.randomBytes(16);
    const passwordHash = crypto.createHash('sha256').update(password).digest('hex');
    const seed = passwordHash.substring(0, 32);
    const cipher = crypto.createCipheriv(C.AES_512, Buffer.from(seed), iv);
    let encrypted = cipher.update(key);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return `${encrypted.toString('hex')}/${iv.toString('hex')}`;
}


'use strict'

const { RSA_NO_PADDING, RSA_PKCS1_OAEP_PADDING } = require('constants');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const util = require('util');

const pbkdf2 = util.promisify(crypto.pbkdf2);
const generateKeyPair = util.promisify(crypto.generateKeyPair);
const writeFile = util.promisify(fs.writeFile);
const readFile = util.promisify(fs.readFile);
const unlink = util.promisify(fs.unlink);

const C = require('../utils/constants');

module.exports = {
    async generatePBKDF(password) {
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

    async generateKeys(username, password) {
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

    async getFile(path) {
        let file;
        try {
            file = await readFile(path);
        }
        catch (error) {
            throw new Error(`getFile: ${path} doesn't exists.`);
        }
        return file.toString('utf-8');
    },

    encryptFile(file, publicKey) {
        const iv = crypto.randomBytes(16);
        const seed = crypto.createHash('sha512').update(file).digest('hex').substring(0, 32);
        const cipher = crypto.createCipheriv(C.AES_512, Buffer.from(seed), iv);
        let encryptedFile = cipher.update(file);
        encryptedFile = Buffer.concat([encryptedFile, cipher.final()]);
        const buffer = Buffer.from(`${seed}/${iv}`);
        const encryptedKey = crypto.publicEncrypt({key: publicKey, padding: RSA_PKCS1_OAEP_PADDING}, buffer).toString('hex');
        return { encryptedFile, encryptedKey};
    },

    async saveFiles(fileName, storePath, extension, content) {
        const filePath = path.join(__dirname, storePath);
        try {
            await writeFile(filePath + `/${fileName}${extension}`, content);
        }
        catch (error) {
            throw new Error(`saveFiles: ${error}`);
        }
    },

    async deleteFiles(fileName, storePath) {
        const filePath = path.join(__dirname, `${storePath}${fileName}`);
        try {
            await unlink(filePath);
        }
        catch (error) {
            throw new Error(`deleteFiles: ${error}`)
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


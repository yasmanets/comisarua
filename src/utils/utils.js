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
                    type: 'pkcs1',
                    format: 'pem',
                },
                privateKeyEncoding: {
                    type: 'pkcs1',
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
        return file;
    },

    encryptFile(file, publicKey, documentId) {
        const iv = crypto.randomBytes(16);
        const seed = crypto.createHash('sha512').update(documentId.toString()).digest('hex').substring(0, 32);
        const cipher = crypto.createCipheriv(C.AES_512, Buffer.from(seed), iv);
        let encryptedFile = cipher.update(file);
        encryptedFile = Buffer.concat([encryptedFile, cipher.final()]);
        const buffer = Buffer.from(`${seed}/${iv.toString('hex')}`);
        const encryptedKey = crypto.publicEncrypt(publicKey, buffer).toString('hex');
        return { encryptedFile, encryptedKey};
    },

    onlyEncryptFile(file, documentId) {
        const iv = crypto.randomBytes(16);
        const seed = crypto.createHash('sha512').update(documentId.toString()).digest('hex').substring(0, 32);
        const cipher = crypto.createCipheriv(C.AES_512, Buffer.from(seed), iv);
        let encryptedFile = cipher.update(file);
        encryptedFile = Buffer.concat([encryptedFile, cipher.final()]);
        const key = Buffer.from(`${seed}/${iv.toString('hex')}`);
        return { encryptedFile, key };
    },

    encryptKey(key, publicKey) {
        return crypto.publicEncrypt(publicKey, key).toString('hex');
    },

    decryptFile(file, key, documentId) {
        const iv = Buffer.from(key.split('/')[1], 'hex');
        const seed = crypto.createHash('sha512').update(documentId.toString()).digest('hex').substring(0, 32);
        let decipher = crypto.createDecipheriv(C.AES_512, Buffer.from(seed), iv);
        let clearFile = decipher.update(file);
        return Buffer.concat([clearFile, decipher.final()]);
    },

    decryptKey(key, encPrivateKey, user) {
        const iv = Buffer.from(encPrivateKey.split('/')[1], 'hex');
        let privateKey = Buffer.from(encPrivateKey.split('/')[0], 'hex');
        const seed = crypto.createHash('sha256').update(user.password).digest('hex').substring(0, 32);
        let decipher = crypto.createDecipheriv(C.AES_512, Buffer.from(seed), iv)
        privateKey = decipher.update(privateKey);
        privateKey = Buffer.concat([privateKey, decipher.final()]).toString();
        return crypto.privateDecrypt({key: privateKey, passphrase: user.password}, Buffer.from(key, 'hex')).toString();
    },

    decryptPrivateKey (privateKey, user) {
        const iv = Buffer.from(privateKey.split('/')[1], 'hex');
        let pKey = Buffer.from(privateKey.split('/')[0], 'hex');
        const seed = crypto.createHash('sha256').update(user.password).digest('hex').substring(0, 32);
        let decipher = crypto.createDecipheriv(C.AES_512, Buffer.from(seed), iv)
        pKey = decipher.update(pKey);
        return Buffer.concat([pKey, decipher.final()]);
    },

    async publicDecrypt (keyOwner, encrypted) {
        const keyPath = path.join(__dirname, `${process.env.PB_PATH}/${keyOwner}.pub`);
        let publicKey;
        try {
            publicKey = await this.getFile(keyPath);
        }
        catch (error) {
            throw new Error(error);
        }
        return crypto.publicDecrypt({key: publicKey}, Buffer.from(encrypted, 'hex')).toString('hex');
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


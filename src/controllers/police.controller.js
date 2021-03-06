'use strict'

const UserModel = require('../models/user.model');
const DocumentModel = require('../models/document.model');
const logger = require('../services/Logger');
const C = require('../utils/constants');
const utils = require('../utils/utils');
const path = require('path');
const crypto = require('crypto');

const policeController = {
    newPoliceForm(req, res) {
        return res.status(200).render('polices/register');
    },

    async newPolice(req, res, next) {
        const params = req.body;
        const user = new UserModel();
        user.username = params.username;
        user.password = params.password;
        user.role = params.role;
        try {
            await user.save();
        }
        catch (error) {
            const errors = [];
            logger.error(`POST /newPolice: ${error}`);
            const message = error.code === C.DUPLICATE_KEY ? 'El nombre de usuario ya está registrado en el sistema.' : 'Se ha producido un error al guardar los datos del usuario';
            errors.push({ message });
            return res.status(500).render('polices/register', { errors });
        }
        logger.info(`POST /newPolice: ${user._id}`);
        req.flash('success', 'Policia registrado con éxito');
        res.status(200).redirect('/')
        return next();
    },

    async getAllPolices (req, res, next) {
        const errors = [];
        const user = req.user;
        let polices;
        try {
            polices = await UserModel.find({_id: {$ne: user}})
        }
        catch (error) {
            logger.error(`GET getAllPolices: ${error}`)
            errors.push({message: 'Se ha producido un error al listar los policias'});
            return res.status(500).render('index', { errors });
        }
        logger.info(`GET getAllPolices: ${polices.length}`);
        return res.status(200).render('polices/publish', { polices })
    },

    async informationForm (req, res) {
        const errors = [];
        const user = req.user;
        const params = [];
        params.userId = user._id
        let documents;
        try {
            documents = await DocumentModel.find({type: 'personal', 'access': {$elemMatch: { 'userId': user._id}}});
        }
        catch (error) {
            logger.error(`GET /informationForm: ${error}`);
            errors.push({message: 'Se ha producido un error al recuperar los documentos que has subido. '});
            return res.status(200).render('index', { errors });
        }
        return res.status(200).render('polices/profile', { documents });
    },

    async uploadDocument (req, res, next) {
        const errors = [];
        const user = req.user;
        const document = new DocumentModel();
        const file = req.file;
        let publicKey;
        try {
            publicKey = await utils.getFile(path.join(__dirname, `${process.env.PB_PATH}/${user.username}.pub`));
        }
        catch (error) {
            logger.error(`POST /uploadDocument: ${error}`);
            errors.push({ message: 'Se ha producido un error al cifrar el documento con tus datos. Por favor, inténtalo de nuevo. '});
            return res.status(401).render('polices/profile', { errors });
        }

        let fileContent;
        try {
            fileContent = await utils.getFile(path.join(__dirname, `../../uploads/temp/${file.filename}`));
        }
        catch (error) {
            logger.error(`POST /uploadDocument: ${error}`);
            errors.push({ message: 'Se ha producido un error al cifrar el documento con tus datos. Por favor, inténtalo de nuevo. '});
            return res.status(401).render('polices/profile', { errors });
        }
        let values = utils.encryptFile(fileContent, publicKey, document._id);

        const fileName = path.basename(file.originalname).split('.')[0];
        const fileExtension = path.extname(file.originalname)
        
        document.title = fileName;
        document.type = 'personal';
        document.access = [];
        document.access[0] = {}
        document.access[0].userId = user._id;
        document.access[0].key = values.encryptedKey

        try {
            await utils.saveFiles(fileName, '../../uploads/personalInfo/', fileExtension, values.encryptedFile);
        }
        catch (error) {
            logger.error(`POST /uploadDocument: ${error}`);
        }
        try {
            await utils.deleteFiles(file.filename, `../../uploads/temp/`);
        }
        catch (error) {
            logger.error(`POST /uploadDocument: ${error}`);
        }

        try {
            await document.save();
        }
        catch (error) {
            logger.error(`POST /uploadDocument: ${error}`);
            errors.push({ message: 'Se ha producido un error al guardar el documento que has subido. Por favor, inténtalo de nuevo. '});
            return res.status(401).render('polices/profile', { errors });
        }
        logger.info(`POST /uploadDocument: ${user._id}, ${document._id}`);
        req.flash('success', 'Documento subido con éxito');
        return res.status(200).redirect('/police/profile')
    },

    async viewDocument (req, res, next) {
        const errors = [];
        const id = req.params.id;
        let user = req.user;
        const documentPath = req.originalUrl.includes('personalDocument') ? 'personalInfo' : 'sharedInfo';

        if (!id || !user) {
            logger.warn(`GET /viewDocument: req.params.id or req.user not exists`);
            errors.push({ message: 'La peteción no se ha formulado correctamente. Por favor, inténtalo de nuevo. '});
            return res.status(400).render('index', { errors });
        }
        try {
            user = await UserModel.findById(user._id);
        }
        catch (error) {
            logger.warn(`GET /viewDocument: ${error}`);
            errors.push({ message: 'Se ha producido un error al obtener el documento que buscas. Por favor, inténtalo de nuevo. '});
            return res.status(500).render('index', { errors });
        }

        let document;
        try {
            document = await DocumentModel.findById(id);
        }
        catch (error) {
            logger.warn(`GET /viewDocument: ${error}`);
            errors.push({ message: 'Se ha producido un error al obtener el documento que buscas. Por favor, inténtalo de nuevo. '});
            return res.status(500).render('index', { errors });
        }

        for(const accessGranted of document.access) {
            if (accessGranted.userId.toString() === user._id.toString()) {
                let privateKey;
                try {
                    privateKey = await utils.getFile(path.join(__dirname, `${process.env.PR_PATH}/${user.username}.pem`));
                }
                catch (error) {
                    logger.error(`POST /viewDocument: ${error}`);
                    errors.push({ message: 'Se ha producido un error al obtener el documento que buscas. Por favor, inténtalo de nuevo. '});
                    return res.status(500).render('index', { errors });
                }
                const clearKey = utils.decryptKey(accessGranted.key, privateKey.toString('utf-8'), user);
                let file;
                try {
                    file = await utils.getFile(path.join(__dirname, `../../uploads/${documentPath}/${document.title}.pdf`));
                }
                catch (error) {
                    logger.error(`POST /viewDocument: ${error}`);
                    errors.push({ message: 'Se ha producido un error al obtener el documento que buscas. Por favor, inténtalo de nuevo. '});
                    return res.status(500).render('index', { errors });
                }
                let clearFile = utils.decryptFile(file, clearKey, document._id)
                try {
                    await utils.saveFiles(document.title, '../../uploads/temp', '.pdf', clearFile);
                }
                catch (error) {
                    logger.error(`POST /uploadDocument: ${error}`);
                }

                const options = {
                    root: path.join(__dirname, `../../uploads/temp/`),
                }
                req.document = document
                logger.info(`GET /viewDocument: ${user._id}, ${document.title}`);
                return res.status(200).sendFile(`${document.title}.pdf`, options);
            }
        }
    },

    async isShared (req, res, next) {
        const params = req.body;
        if (params.polices) {
            return next();
        }
        const file = req.file;
        try {
            await utils.deleteFiles(file.filename, `../../uploads/temp/`);
        }
        catch (error) {
            logger.error(`POST /isShared: ${error}`);
        }
        logger.info(`POST isShared: ${file.filename} removed`);
        req.flash('error', 'Debes seleccionar al menos un policía con el que compartir la informacióin');
        return res.status(400).redirect('/police/publish');
    },

    async uploadPublicInfo (req, res, next) {
        const params = req.body;
        const errors = [];
        const user = req.user;
        const document = new DocumentModel();
        document.access = [];
        const file = req.file;
        let fileContent;
        try {
            fileContent = await utils.getFile(path.join(__dirname, `../../uploads/temp/${file.filename}`));
        }
        catch (error) {
            logger.error(`POST /uploadPublicInfo: ${error}`);
            errors.push({ message: 'Se ha producido un error al cifrar el documento con tus datos. Por favor, inténtalo de nuevo. '});
            return res.status(401).render('polices/publish', { errors });
        }
        let values = utils.onlyEncryptFile(fileContent, document._id);
        const fileName = path.basename(file.originalname).split('.')[0];
        const fileExtension = path.extname(file.originalname)
        document.title = fileName;
        document.type = params.type;
        document.publisher = user.username;
        let publicKey;
        try {
            publicKey = await utils.getFile(path.join(__dirname, `${process.env.PB_PATH}/${user.username}.pub`));
        }
        catch (error) {
            logger.error(`POST /uploadPublicInfo: ${error}`);
            errors.push({ message: 'Se ha producido un error al cifrar el documento con tus datos. Por favor, inténtalo de nuevo. '});
            return res.status(401).render('polices/publish', { errors });
        }
        const encryptedKey = utils.encryptKey(values.key, publicKey);
        document.access[0] = {};
        document.access[0].userId = user._id;
        document.access[0].key = encryptedKey

        params.polices.forEach(async (police, index) => {
            let publicKey;
            const id = police.split('-')[0];
            const username = police.split('-')[1];
            try {
                publicKey = await utils.getFile(path.join(__dirname, `${process.env.PB_PATH}/${username}.pub`));
            }
            catch (error) {
                logger.error(`POST /uploadPublicInfo: ${error}`);
                errors.push({ message: 'Se ha producido un error al cifrar el documento con tus datos. Por favor, inténtalo de nuevo. '});
                return res.status(500).render('polices/publish', { errors });
            }
            const encryptedKey = utils.encryptKey(values.key, publicKey);
            document.access[index+1] = {}
            document.access[index+1].userId = id;
            document.access[index+1].key = encryptedKey;
        });
        try {
            await utils.saveFiles(fileName, '../../uploads/sharedInfo/', fileExtension, values.encryptedFile);
        }
        catch (error) {
            logger.error(`POST /uploadPublicInfo: ${error}`);
        }
        try {
            await utils.deleteFiles(file.filename, `../../uploads/temp/`);
        }
        catch (error) {
            logger.error(`POST /uploadPublicInfo: ${error}`);
        }
        try {
            await document.save();
        }
        catch (error) {
            logger.error(`POST /uploadPublicInfo: ${error}`);
            errors.push({ message: 'Se ha producido un error al guardar el documento que has subido. Por favor, inténtalo de nuevo. '});
            return res.status(401).render('polices/publish', { errors });
        }
        logger.info(`POST /uploadDocument: ${user._id}, ${document._id}`);
        req.flash('success', 'Documento subido con éxito');
        res.status(200).redirect('/police/publish');
        req.fileContent = fileContent;
        req.document = document;
        return next();
    },

    async getPublicDocuments (req, res, next) {
        const errors = [];
        const user = req.user;
        const params = [];
        params.userId = user._id
        let documents;
        try {
            documents = await DocumentModel.find({type: {$ne: 'personal'}, access: {$elemMatch: { 'userId': user._id}}});
        }
        catch (error) {
            logger.error(`GET /getPublicDocuments: ${error}`);
            errors.push({message: 'Se ha producido un error al recuperar los documentos.' });
            return res.status(200).render('index', { errors });
        }
        return res.status(200).render('polices/publicDocuments', { documents });
    },

    async verifySignature (req, res, next) {
        const errors = [];
        const id = req.params.id;
        let user = req.user;
        try {
            user = await UserModel.findById(req.user._id);
        }
        catch (error) {
            logger.warn(`GET /verifySignature: ${error}`);
            errors.push({ message: 'Se ha producido un error al obtener el documento que buscas. Por favor, inténtalo de nuevo. '});
            return res.status(500).render('index', { errors });
        }
        let document;
        try {
            document = await DocumentModel.findById(id);
        }
        catch (error) {
            logger.error(`GET verifySignature: ${error}`);
            return res.status(500).redirect('/police/documents');
        }
        const key = DocumentModel.hasPermission(user._id, document.access);
        if (!key) {
            logger.warn(`GET /verifySignature: ${user._id} doesn't have permissions`);
            errors.push({ message: 'No tienes permisos para acceder a este documento.' });
            return res.status(401).render('polices/publish', { errors }); 
        }
        let privateKey;
        try {
            privateKey = await utils.getFile(path.join(__dirname, `${process.env.PR_PATH}/${user.username}.pem`));
        }
        catch (error) {
            logger.error(`POST /verifySignature: ${error}`);
            errors.push({ message: 'Se ha producido un error al obtener el documento que buscas. Por favor, inténtalo de nuevo. '});
            return res.status(500).render('index', { errors });
        }
        const clearKey = utils.decryptKey(key, privateKey.toString('utf-8'), user);
        let file;
        try {
            file = await utils.getFile(path.join(__dirname, `../../uploads/sharedInfo/${document.title}.pdf`));
        }
        catch (error) {
            logger.error(`POST /verifySignature: ${error}`);
            errors.push({ message: 'Se ha producido un error al verificar la firma digital. Por favor, inténtalo de nuevo. '});
            return res.status(500).render('index', { errors });
        }
        let clearFile = utils.decryptFile(file, clearKey, document._id)
        const hash = crypto.createHash('sha512').update(clearFile).digest('hex');
        let signature;
        try {
            signature = await utils.publicDecrypt(document.publisher, document.signature);
        }
        catch (error) {
            logger.error(`POST /verifySignature: ${error}`);
            errors.push({ message: 'Se ha producido un error al verificar la firma digital. Por favor, inténtalo de nuevo. '});
            return res.status(500).render('index', { errors });
        }
        if (signature !== hash) {
            logger.error(`POST /verifySignature: ${user._id}, ${document._id} not verified`);
            req.flash('error', '¡¡¡La firma digital del documento no es correcta.!!!');
            return res.status(403).redirect('/police/documents');
        }
        logger.info(`GET /verifySignature: ${user._id}, ${document._id} verified`);
        req.flash('success', 'La firma digital del documento es correcta');
        return res.status(200).redirect('/police/documents');
    }
}

module.exports = policeController;

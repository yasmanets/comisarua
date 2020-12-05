'use strict'

const UserModel = require('../models/user.model');
const DocumentModel = require('../models/document.model');
const logger = require('../services/Logger');
const C = require('../utils/constants');
const utils = require('../utils/utils');
const path = require('path');


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

    informationForm (req, res) {
        return res.status(200).render('polices/profile');
    },

    async uploadPersonalInfo (req, res, next) {
        const errors = [];
        const user = req.user;
        const document = new DocumentModel();
        const file = req.file;
        let publicKey;
        try {
            publicKey = await utils.getFile(path.join(__dirname, `${process.env.PB_PATH}/${user.username}.pub`));
        }
        catch (error) {
            logger.error(`POST /uploadPersonalInfo: ${error}`);
            errors.push({ message: 'Se ha producido un error al cifrar el documento con tus datos. Por favor, inténtalo de nuevo. '});
            return res.status(401).render('polices/profile', { errors });
        }

        let fileContent;
        try {
            fileContent = await utils.getFile(path.join(__dirname, `../../uploads/personalInfo/${file.filename}`));
        }
        catch (error) {
            logger.error(`POST /uploadPersonalInfo: ${error}`);
            errors.push({ message: 'Se ha producido un error al cifrar el documento con tus datos. Por favor, inténtalo de nuevo. '});
            return res.status(401).render('polices/profile', { errors });
        }
        let values = utils.encryptFile(fileContent, publicKey);

        const fileName = path.basename(file.originalname).split('.')[0];
        const fileExtension = path.extname(file.originalname)
        
        document.name = fileName;
        document.access.userId = user._id;
        document.access.key = values.encryptedKey

        try {
            await utils.saveFiles(fileName, '../../uploads/personalInfo/', fileExtension, values.encryptedFile);
        }
        catch (error) {
            logger.error(`POST /uploadPersonalInfo: ${error}`);
        }
        try {
            await utils.deleteFiles(file.filename, `../../uploads/personalInfo/`);
        }
        catch (error) {
            logger.error(`POST /uploadPersonalInfo: ${error}`);

        }

        try {
            await document.save;
        }
        catch (error) {
            logger.error(`POST /uploadPersonalInfo: ${error}`);
            errors.push({ message: 'Se ha producido un error al guardar el documento que has subido. Por favor, inténtalo de nuevo. '});
            return res.status(401).render('polices/profile', { errors });
        }
        logger.info(`POST /uploadPersonalInfo: ${user._id}, ${document._id}`);
        req.flash('success', 'Documento subido con éxito');
        return res.status(200).redirect('/police/profile')
    }
}

module.exports = policeController;

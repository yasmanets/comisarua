const policeController = require('../controllers/police.controller');
const crypto = require('../middlewares/cypher');
const { Router } = require('express');
const router = Router();
const multer = require('multer');
const path = require('path');
const auth = require('../middlewares/authorization');
const roles = require('../utils/roles');
const cipher = require('../middlewares/cypher');

const upload = multer({ dest: path.join(__dirname, '../../uploads/temp') }).single('file');

router.get('/new', policeController.newPoliceForm);
router.post('/new', crypto.encryptPassword, policeController.newPolice, crypto.generateKeyPair);
router.get('/profile', auth.authorize(roles.police), policeController.informationForm);
router.post('/info', auth.authorize(roles.police), upload, policeController.uploadDocument);
router.get('/personalDocument/:id', auth.authorize(roles.police), policeController.viewDocument);
router.get('/publish', auth.authorize(roles.police), policeController.getAllPolices);
router.post('/publish', auth.authorize(roles.police), upload, policeController.isShared, policeController.uploadPublicInfo, cipher.createSignature);
router.get('/documents', auth.authorize(roles.police), policeController.getPublicDocuments);
router.get('/publicDocument/:id', auth.authorize(roles.police), policeController.viewDocument);

module.exports = router

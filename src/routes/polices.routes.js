const policeController = require('../controllers/police.controller');
const crypto = require('../middlewares/cypher');
const { Router } = require('express');
const router = Router();
const multer = require('multer');
const path = require('path');

const upload = multer({ dest: path.join(__dirname, '../../uploads/personalInfo') }).single('file');


router.get('/new', policeController.newPoliceForm);
router.post('/new', crypto.encryptPassword, policeController.newPolice, crypto.generateKeyPair);
router.get('/info', policeController.informationForm);
router.post('/info', upload, policeController.uploadPersonalInfo);

module.exports = router

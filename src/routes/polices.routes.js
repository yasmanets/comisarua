const policeController = require('../controllers/police.controller');
const crypto = require('../middlewares/cypher');
const { Router } = require('express');
const router = Router();


router.get('/new', policeController.newPoliceForm);
router.post('/new', crypto.encryptPassword, policeController.newPolice, crypto.generateKeyPair);

module.exports = router

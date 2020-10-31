const { Router } = require('express');
const policeController = require('../controllers/police.controller');
const router = Router();
const policeControllwer = require('../controllers/police.controller');

router.get('/new', policeController.newPoliceForm);
router.post('/new', policeController.newPolice);

module.exports = router

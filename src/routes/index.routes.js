const { Router } = require('express');
const router = Router();
const indexController = require('../controllers/index.controller');

router.get('/', indexController.index);
router.get('/login', indexController.loginForm);
router.post('/login', indexController.login);

module.exports = router

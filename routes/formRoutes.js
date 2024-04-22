const express = require('express');
const router = express.Router();
const formController = require('../controllers/formController');

router.get('/', formController.renderForm);
router.post('/enviar-formulario', formController.sendForm);
router.get('/autorizar-formulario/:token', formController.authorizeForm);
router.get('/no-autorizar-formulario/:token', formController.declineForm);

module.exports = router;

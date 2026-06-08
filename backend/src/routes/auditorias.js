const express = require('express');
const { getAllAuditorias } = require('../controllers/auditoriaController');
const authMiddleware = require('../middleware/auth');
const authorize = require('../middleware/authorize');

const router = express.Router();

router.get('/', authMiddleware, authorize(['ADMIN']), getAllAuditorias);

module.exports = router;

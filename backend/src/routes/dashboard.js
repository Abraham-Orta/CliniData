const express = require('express');
const { getDashboardStats } = require('../controllers/dashboardController');
const authMiddleware = require('../middleware/auth');
const authorize = require('../middleware/authorize');

const router = express.Router();

router.get('/', authMiddleware, authorize(['ADMIN', 'MEDICO']), getDashboardStats);

module.exports = router;

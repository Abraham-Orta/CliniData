const express = require('express');
const router = express.Router();
const controller = require('../controllers/appointmentController');
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');

// All routes require authentication
router.use(auth);

// List / filter appointments
router.get('/', authorize(['ADMIN', 'MEDICO']), controller.listAppointments);
router.get('/:id', authorize(['ADMIN', 'MEDICO']), controller.getAppointment);
router.post('/', authorize(['ADMIN', 'MEDICO']), controller.createAppointment);
router.put('/:id', authorize(['ADMIN', 'MEDICO']), controller.updateAppointment);
router.delete('/:id', authorize(['ADMIN', 'MEDICO']), controller.deleteAppointment);

module.exports = router;

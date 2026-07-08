const express = require('express');
const router = express.Router();
const controller = require('../controllers/appointmentController');
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');

// All routes require authentication
router.use(auth);

// List / filter appointments
router.get('/', authorize(['ADMIN', 'MEDICO', 'ENFERMERO']), controller.listAppointments);
router.get('/:id', authorize(['ADMIN', 'MEDICO', 'ENFERMERO']), controller.getAppointment);
router.post('/', authorize(['ADMIN', 'MEDICO', 'ENFERMERO']), controller.createAppointment);
router.put('/:id', authorize(['ADMIN', 'MEDICO', 'ENFERMERO']), controller.updateAppointment);
router.delete('/:id', authorize(['ADMIN', 'MEDICO', 'ENFERMERO']), controller.deleteAppointment);

module.exports = router;

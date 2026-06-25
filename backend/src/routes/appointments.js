const express = require('express');
const router = express.Router();
const controller = require('../controllers/appointmentController');
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');

// All routes require authentication
router.use(auth);

// List / filter appointments
router.get('/', authorize('read:citas'), controller.listAppointments);
router.get('/:id', authorize('read:citas'), controller.getAppointment);
router.post('/', authorize('create:citas'), controller.createAppointment);
router.put('/:id', authorize('update:citas'), controller.updateAppointment);
router.delete('/:id', authorize('delete:citas'), controller.deleteAppointment);

module.exports = router;

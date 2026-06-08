const express = require('express');
const {
  getAllPatients,
  getPatient,
  createPatient,
  updatePatient,
  deletePatient
} = require('../controllers/patientController');
const authMiddleware = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const { validatePatientAccess } = require('../middleware/accessMiddleware');
const validate = require('../middleware/validate');
const { patientSchema } = require('../utils/patientValidators');

const router = express.Router();

// Todas las rutas requieren inicio de sesión previo
router.use(authMiddleware);

// Rutas Clínicas: Reservadas para personal médico con validación relacional (ReBAC)
router.get('/', authorize(['MEDICO']), getAllPatients);
router.post('/', authorize(['MEDICO']), validate(patientSchema), createPatient);

router.get('/:id', authorize(['MEDICO']), validatePatientAccess, getPatient);
router.put('/:id', authorize(['MEDICO']), validatePatientAccess, validate(patientSchema), updatePatient);
router.patch('/:id', authorize(['MEDICO']), validatePatientAccess, validate(patientSchema, { partial: true }), updatePatient);

// Ruta Administrativa: Borrado de expedientes exclusivo para Administradores
// Se omite validatePatientAccess para que ADMIN pueda borrar por ID sin ver datos
router.delete('/:id', authorize(['ADMIN']), deletePatient);

module.exports = router;

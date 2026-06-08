const express = require('express');
const {
  createConsulta,
  getPacienteHistorial,
  addColaborador,
  createNotaClinica
} = require('../controllers/consultaController');
const authMiddleware = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const { validatePatientAccess } = require('../middleware/accessMiddleware');

const router = express.Router();

router.use(authMiddleware);

// Rutas Clínicas de consultas (exclusivas para Médicos)
// En la creación, el middleware validará el acceso al req.body.pacienteId
router.post('/', authorize(['MEDICO']), validatePatientAccess, createConsulta);

// Ver historial de consultas de un paciente (req.params.pacienteId)
router.get('/paciente/:pacienteId', authorize(['MEDICO']), validatePatientAccess, getPacienteHistorial);

// Acciones secundarias en consultas creadas
router.post('/:id/colaboradores', authorize(['MEDICO']), addColaborador);
router.post('/:id/notas', authorize(['MEDICO']), createNotaClinica);

module.exports = router;

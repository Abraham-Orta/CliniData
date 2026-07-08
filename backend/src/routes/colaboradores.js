const express = require('express');
const { getMedicosDisponibles, getEquipoPaciente, asignarColaborador } = require('../controllers/colaboradorController');
const authMiddleware = require('../middleware/auth');
const authorize = require('../middleware/authorize');

const router = express.Router();

router.use(authMiddleware);

// Rutas para colaboradores (solo accesibles para médicos, o admins si quisieran ver, pero nos enfocamos en médicos)
router.get('/medicos', authorize(['MEDICO']), getMedicosDisponibles);
router.get('/paciente/:pacienteId', authorize(['MEDICO']), getEquipoPaciente);
router.post('/asignar', authorize(['MEDICO']), asignarColaborador);

module.exports = router;

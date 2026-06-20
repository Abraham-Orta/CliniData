const express = require('express');
const {
  createConsulta,
  getPacienteHistorial,
  addColaborador,
  createNotaClinica,
  uploadAttachment,
  listAttachments,
  downloadAttachment,
  deleteAttachment
} = require('../controllers/consultaController');
const authMiddleware = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const { validatePatientAccess, validateConsultaAccess } = require('../middleware/accessMiddleware');
const upload = require('../config/multer');

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

// Endpoints de adjuntos
router.post('/:id/attachments', authorize(['MEDICO']), validateConsultaAccess, upload.single('file'), uploadAttachment);
router.get('/:id/attachments', authorize(['MEDICO']), validateConsultaAccess, listAttachments);
router.get('/:id/attachments/:attachmentId', authorize(['MEDICO']), validateConsultaAccess, downloadAttachment);
router.delete('/:id/attachments/:attachmentId', authorize(['MEDICO']), validateConsultaAccess, deleteAttachment);

module.exports = router;

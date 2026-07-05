const express = require('express');
const path = require('path');
const fs = require('fs');
const { uploadAdjunto, getAdjuntosPaciente } = require('../controllers/adjuntoController');
const authMiddleware = require('../middleware/auth');
const authorize = require('../middleware/authorize');

const router = express.Router();

let upload;
try {
  const multer = require('multer');
  
  // Asegurarnos de que existe la carpeta uploads
  const uploadDir = path.join(__dirname, '../../uploads');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, uniqueSuffix + '-' + file.originalname);
    }
  });

  upload = multer({ 
    storage,
    limits: { fileSize: 10 * 1024 * 1024 } // Límite 10MB
  });
} catch (error) {
  // Fallback si multer no está instalado aún por el problema de permisos
  console.warn("Multer no está instalado. Subida de archivos deshabilitada temporalmente.");
  upload = {
    single: () => (req, res, next) => next(new Error('Multer no está instalado. Instálalo con "npm install multer"'))
  };
}

router.use(authMiddleware);

// Rutas
router.post('/upload', authorize(['MEDICO']), upload.single('archivo'), uploadAdjunto);
router.get('/paciente/:pacienteId', authorize(['MEDICO']), getAdjuntosPaciente);

module.exports = router;

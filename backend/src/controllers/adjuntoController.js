const prisma = require('../config/database');

/**
 * Subir un archivo adjunto
 * Este controlador asume que el middleware de multer ya procesó el archivo
 * y está disponible en req.file
 */
const uploadAdjunto = async (req, res, next) => {
  try {
    const { consultaId } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: 'No se subió ningún archivo.' });
    }

    if (!consultaId) {
      return res.status(400).json({ error: 'Se requiere el ID de la consulta.' });
    }

    // Verificar permisos sobre la consulta
    const consulta = await prisma.consulta.findUnique({
      where: { id: consultaId },
      include: {
        paciente: true,
        colaboradores: { select: { medicoId: true } }
      }
    });

    if (!consulta) {
      return res.status(404).json({ error: 'Consulta no encontrada.' });
    }

    const esPrincipal = consulta.paciente.medicoPrincipalId === req.userId;
    const esColaborador = consulta.colaboradores.some(c => c.medicoId === req.userId);
    const esDueñoConsulta = consulta.medicoId === req.userId;

    if (!esPrincipal && !esColaborador && !esDueñoConsulta) {
      return res.status(403).json({ error: 'No tienes permiso para adjuntar archivos a este caso.' });
    }

    const adjunto = await prisma.adjunto.create({
      data: {
        nombre: file.originalname,
        ruta: file.filename, // Guardamos solo el nombre del archivo, la ruta base la armamos al servir
        mimeType: file.mimetype,
        size: file.size,
        consultaId
      }
    });

    await prisma.auditoria.create({
      data: {
        accion: 'ARCHIVO_SUBIDO',
        detalles: `Archivo ${file.originalname} subido al caso del paciente ${consulta.pacienteId}`,
        usuarioId: req.userId
      }
    });

    res.status(201).json(adjunto);
  } catch (error) {
    next(error);
  }
};

/**
 * Obtener los adjuntos de un paciente (todas sus consultas)
 */
const getAdjuntosPaciente = async (req, res, next) => {
  try {
    const { pacienteId } = req.params;

    // Verificar acceso al paciente
    const accessQuery = {
      OR: [
        { medicoPrincipalId: req.userId },
        { consultas: { some: { medicoId: req.userId } } },
        { consultas: { some: { colaboradores: { some: { medicoId: req.userId } } } } }
      ]
    };

    const paciente = await prisma.paciente.findFirst({
      where: { id: pacienteId, AND: [accessQuery] }
    });

    if (!paciente) {
      return res.status(404).json({ error: 'Paciente no encontrado o acceso denegado.' });
    }

    const adjuntos = await prisma.adjunto.findMany({
      where: {
        consulta: { pacienteId }
      },
      orderBy: { creadoEn: 'desc' }
    });

    res.json(adjuntos);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  uploadAdjunto,
  getAdjuntosPaciente
};

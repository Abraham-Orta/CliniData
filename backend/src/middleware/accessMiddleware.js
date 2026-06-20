const prisma = require('../config/database');

/**
 * Middleware para validar el acceso clínico a expedientes de pacientes (ReBAC).
 * Asegura que:
 * 1. Los ADMINs no tengan acceso clínico (403 Forbidden).
 * 2. Un médico solo acceda a pacientes que:
 *    - Registró originalmente (medicoPrincipalId).
 *    - Atendió en una consulta (medicoId).
 *    - Colaboró activamente en una consulta (ColaboradorConsulta).
 */
const validatePatientAccess = async (req, res, next) => {
  const pacienteId = req.params.pacienteId || req.params.id || req.body.pacienteId || req.query.pacienteId;
  const medicoId = req.userId;
  const rol = req.userRole;

  if (!medicoId) {
    return res.status(401).json({ error: 'No autorizado. Token inválido o ausente.' });
  }

  // 1. Capa de Seguridad: Los Administradores no acceden a expedientes clínicos bajo ninguna circunstancia
  if (rol === 'ADMIN') {
    try {
      await prisma.auditoria.create({
        data: {
          accion: 'INTENTO_ACCESO_CLINICO_BLOQUEADO',
          detalles: `ADMIN intentó acceder al paciente ID: ${pacienteId || 'N/A'}`,
          ipAddress: req.ip || '127.0.0.1',
          usuarioId: medicoId
        }
      });
    } catch (e) {
      console.error('Audit failed:', e.message);
    }

    return res.status(403).json({
      error: 'Acceso denegado. Los administradores no tienen permitido visualizar expedientes clínicos.'
    });
  }

  // Si no hay pacienteId en la ruta o cuerpo (por ejemplo, al listar pacientes), pasamos al controlador
  // El propio controlador debe filtrar el listado según las relaciones permitidas.
  if (!pacienteId) {
    return next();
  }

  try {
    // 2. Capa de Seguridad: Validar relación entre el Médico y el Paciente
    const tieneAcceso = await prisma.paciente.findFirst({
      where: {
        id: pacienteId,
        OR: [
          { medicoPrincipalId: medicoId }, // ¿Es el médico principal?
          { consultas: { some: { medicoId: medicoId } } }, // ¿Ha atendido alguna consulta?
          { consultas: { some: { colaboradores: { some: { medicoId: medicoId } } } } } // ¿Es colaborador en alguna consulta?
        ]
      }
    });

    if (!tieneAcceso) {
      // Registrar intento de acceso no autorizado
      try {
        await prisma.auditoria.create({
          data: {
            accion: 'ACCESO_PACIENTE_RECHAZADO',
            detalles: `Médico intentó acceder sin relación autorizada al paciente ID: ${pacienteId}`,
            ipAddress: req.ip || '127.0.0.1',
            usuarioId: medicoId
          }
        });
      } catch (e) {
        console.error('Audit failed:', e.message);
      }

      return res.status(403).json({
        error: 'Acceso denegado. No tiene autorización sobre el expediente clínico de este paciente.'
      });
    }

    // Registrar acceso autorizado
    try {
      await prisma.auditoria.create({
        data: {
          accion: 'ACCESO_PACIENTE_AUTORIZADO',
          detalles: `Médico accedió al paciente ID: ${pacienteId}`,
          ipAddress: req.ip || '127.0.0.1',
          usuarioId: medicoId
        }
      });
    } catch (e) {
      console.error('Audit failed:', e.message);
    }

    next();
  } catch (error) {
    console.error('Error en validatePatientAccess:', error);
    return res.status(500).json({ error: 'Error en la verificación de seguridad de accesos.' });
  }
};

/**
 * Middleware para validar el acceso a una Consulta concreta.
 * Verifica que el médico sea:
 *  - El médico responsable de la consulta
 *  - Un colaborador en la consulta
 *  - El médico principal del paciente asociado
 */
const validateConsultaAccess = async (req, res, next) => {
  const consultaId = req.params.id || req.params.consultaId;
  const medicoId = req.userId;
  const rol = req.userRole;

  if (!medicoId) {
    return res.status(401).json({ error: 'No autorizado. Token inválido o ausente.' });
  }

  if (rol === 'ADMIN') {
    try {
      await prisma.auditoria.create({
        data: {
          accion: 'INTENTO_ACCESO_CONSULTA_BLOQUEADO',
          detalles: `ADMIN intentó acceder a consulta ID: ${consultaId || 'N/A'}`,
          ipAddress: req.ip || '127.0.0.1',
          usuarioId: medicoId
        }
      });
    } catch (e) {
      console.error('Audit failed:', e.message);
    }

    return res.status(403).json({ error: 'Acceso denegado. Los administradores no tienen permitido acceso clínico.' });
  }

  if (!consultaId) return next();

  try {
    const consulta = await prisma.consulta.findUnique({
      where: { id: consultaId },
      include: { paciente: true, colaboradores: true }
    });

    if (!consulta) return res.status(404).json({ error: 'Consulta no encontrada.' });

    const esMedicoConsulta = consulta.medicoId === medicoId;
    const esColaborador = (consulta.colaboradores || []).some(c => c.medicoId === medicoId);
    const esMedicoPrincipal = consulta.paciente && consulta.paciente.medicoPrincipalId === medicoId;

    if (!esMedicoConsulta && !esColaborador && !esMedicoPrincipal) {
      try {
        await prisma.auditoria.create({
          data: {
            accion: 'ACCESO_CONSULTA_RECHAZADO',
            detalles: `Médico ID ${medicoId} intentó acceder sin autorización a consulta ID: ${consultaId}`,
            ipAddress: req.ip || '127.0.0.1',
            usuarioId: medicoId
          }
        });
      } catch (e) {
        console.error('Audit failed:', e.message);
      }
      return res.status(403).json({ error: 'Acceso denegado a esta consulta.' });
    }

    // Auditoría de acceso permitido
    try {
      await prisma.auditoria.create({
        data: {
          accion: 'ACCESO_CONSULTA_AUTORIZADO',
          detalles: `Médico ID ${medicoId} accedió a consulta ID: ${consultaId}`,
          ipAddress: req.ip || '127.0.0.1',
          usuarioId: medicoId
        }
      });
    } catch (e) {
      console.error('Audit failed:', e.message);
    }

    next();
  } catch (error) {
    console.error('Error en validateConsultaAccess:', error);
    return res.status(500).json({ error: 'Error en la verificación de seguridad de accesos a consulta.' });
  }
};

module.exports = {
  validatePatientAccess,
  validateConsultaAccess
};

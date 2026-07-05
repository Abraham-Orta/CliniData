const prisma = require('../config/database');

/**
 * Obtener lista de médicos disponibles para invitar como colaboradores
 */
const getMedicosDisponibles = async (req, res, next) => {
  try {
    const medicos = await prisma.usuario.findMany({
      where: { rol: 'MEDICO', id: { not: req.userId } },
      select: { id: true, nombre: true, apellido: true }
    });
    res.json(medicos);
  } catch (error) {
    next(error);
  }
};

/**
 * Obtener el equipo clínico de un paciente específico
 */
const getEquipoPaciente = async (req, res, next) => {
  try {
    const { pacienteId } = req.params;

    // Obtener el médico principal
    const paciente = await prisma.paciente.findUnique({
      where: { id: pacienteId },
      include: {
        medicoPrincipal: { select: { id: true, nombre: true, apellido: true } },
        consultas: {
          include: {
            colaboradores: {
              include: {
                medico: { select: { id: true, nombre: true, apellido: true } }
              }
            }
          }
        }
      }
    });

    if (!paciente) return res.status(404).json({ error: 'Paciente no encontrado' });

    // Extraer todos los médicos involucrados (sin repetir)
    const equipoMap = new Map();
    equipoMap.set(paciente.medicoPrincipal.id, {
      ...paciente.medicoPrincipal,
      rolEnCaso: 'Médico Principal'
    });

    paciente.consultas.forEach(consulta => {
      consulta.colaboradores.forEach(col => {
        if (!equipoMap.has(col.medico.id)) {
          equipoMap.set(col.medico.id, {
            ...col.medico,
            rolEnCaso: 'Especialista Colaborador'
          });
        }
      });
    });

    res.json(Array.from(equipoMap.values()));
  } catch (error) {
    next(error);
  }
};

/**
 * Asignar un médico colaborador a la última consulta del paciente (o crear una si no tiene)
 */
const asignarColaborador = async (req, res, next) => {
  try {
    const { pacienteId, medicoId } = req.body;
    
    // Verificar que el paciente existe
    const paciente = await prisma.paciente.findUnique({
      where: { id: pacienteId },
      include: { consultas: { orderBy: { fecha: 'desc' }, take: 1 } }
    });

    if (!paciente) return res.status(404).json({ error: 'Paciente no encontrado' });

    if (medicoId === req.userId) {
      return res.status(400).json({ error: 'No puedes invitarte a ti mismo' });
    }

    let consultaId;
    if (paciente.consultas.length > 0) {
      consultaId = paciente.consultas[0].id;
    } else {
      // Si el paciente no tiene consultas aún, le creamos una consulta base para el caso
      const nuevaConsulta = await prisma.consulta.create({
        data: {
          motivo: 'Evaluación inicial / Interconsulta',
          pacienteId: paciente.id,
          medicoId: req.userId
        }
      });
      consultaId = nuevaConsulta.id;
    }

    const colab = await prisma.colaboradorConsulta.create({
      data: {
        consultaId,
        medicoId
      },
      include: { medico: { select: { nombre: true, apellido: true } } }
    });

    await prisma.auditoria.create({
      data: {
        accion: 'INTERCONSULTA_ASIGNADA',
        detalles: `Dr. ${colab.medico.apellido} asignado al caso del paciente ${pacienteId}`,
        usuarioId: req.userId
      }
    });

    res.status(201).json(colab);
  } catch (error) {
    if (error.code === 'P2002') return res.status(400).json({ error: 'El médico ya es parte del equipo para este caso' });
    next(error);
  }
};

module.exports = {
  getMedicosDisponibles,
  getEquipoPaciente,
  asignarColaborador
};

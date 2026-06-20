const prisma = require('../config/database');
const { consultaSchema, notaClinicaSchema } = require('../utils/consultaValidators');
const { encrypt, decrypt } = require('../utils/securityHelper');
const fs = require('fs');
const path = require('path');

/**
 * Registrar una nueva consulta médica para un paciente, con diagnósticos, tratamientos y colaboradores opcionales.
 */
const createConsulta = async (req, res, next) => {
  try {
    const data = consultaSchema.parse(req.body);
    const medicoId = req.userId;

    // Verificar que el paciente existe
    const paciente = await prisma.paciente.findUnique({
      where: { id: data.pacienteId }
    });

    if (!paciente) {
      return res.status(404).json({ error: 'Paciente no encontrado.' });
    }

    // Resolver los diagnósticos (vincular o crear)
    const diagnosticosConectados = [];
    if (data.diagnosticos && data.diagnosticos.length > 0) {
      for (const diagCodigo of data.diagnosticos) {
        let diagnostico = await prisma.diagnostico.findUnique({
          where: { codigo: diagCodigo }
        });

        if (!diagnostico) {
          // Si no existe el código CIE-10, lo autocreamos de forma genérica
          diagnostico = await prisma.diagnostico.create({
            data: {
              codigo: diagCodigo,
              descripcion: `Diagnóstico autocreado para código ${diagCodigo}`
            }
          });
        }
        diagnosticosConectados.push({ diagnosticoId: diagnostico.id });
      }
    }

    // Construir la creación de la consulta (cifrando campos sensibles)
    const consulta = await prisma.consulta.create({
      data: {
        motivo: encrypt(data.motivo),
        sintomas: data.sintomas ? encrypt(data.sintomas) : null,
        presionArterial: data.presionArterial,
        temperatura: data.temperatura,
        frecuenciaCardiaca: data.frecuenciaCardiaca,
        peso: data.peso,
        observaciones: data.observaciones ? encrypt(data.observaciones) : null,
        paciente: { connect: { id: data.pacienteId } },
        medico: { connect: { id: medicoId } },
        // Relación muchos a muchos con Diagnosticos
        diagnosticos: {
          create: diagnosticosConectados
        },
        // Tratamientos asociados (ciframos campos de tratamiento)
        tratamientos: data.tratamientos ? {
          create: data.tratamientos.map(t => ({
            medicamento: encrypt(t.medicamento),
            dosis: encrypt(t.dosis),
            frecuencia: encrypt(t.frecuencia),
            duracion: encrypt(t.duracion),
            indicaciones: t.indicaciones ? encrypt(t.indicaciones) : null
          }))
        } : undefined,
        // Colaboradores asociados inicialmente
        colaboradores: data.colaboradores ? {
          create: data.colaboradores.map(colabId => ({
            medicoId: colabId
          }))
        } : undefined
      },
      include: {
        diagnosticos: { include: { diagnostico: true } },
        tratamientos: true,
        colaboradores: { include: { medico: { select: { id: true, nombre: true, apellido: true, email: true } } } }
      }
    });

    // Desciframos antes de retornar
    const consultaRes = {
      ...consulta,
      motivo: decrypt(consulta.motivo),
      sintomas: consulta.sintomas ? decrypt(consulta.sintomas) : null,
      observaciones: consulta.observaciones ? decrypt(consulta.observaciones) : null,
      tratamientos: consulta.tratamientos ? consulta.tratamientos.map(t => ({
        ...t,
        medicamento: decrypt(t.medicamento),
        dosis: decrypt(t.dosis),
        frecuencia: decrypt(t.frecuencia),
        duracion: decrypt(t.duracion),
        indicaciones: t.indicaciones ? decrypt(t.indicaciones) : null
      })) : []
    };

    // Auditoría
    await prisma.auditoria.create({
      data: {
        accion: 'CREAR_CONSULTA',
        detalles: `Médico registró consulta ID: ${consulta.id} para el paciente ID: ${data.pacienteId}`,
        ipAddress: req.ip || '127.0.0.1',
        usuarioId: medicoId
      }
    }).catch(err => console.error('Audit failed:', err.message));

    res.status(201).json(consultaRes);
  } catch (error) {
    next(error);
  }
};

/**
 * Obtener todo el historial clínico de un paciente.
 * NOTA: Esta ruta ya está protegida por validatePatientAccess a nivel de middleware.
 */
const getPacienteHistorial = async (req, res, next) => {
  try {
    const pacienteId = req.params.pacienteId;

    const consultas = await prisma.consulta.findMany({
      where: { pacienteId },
      include: {
        medico: {
          select: { id: true, nombre: true, apellido: true, email: true }
        },
        diagnosticos: {
          include: {
            diagnostico: true
          }
        },
        tratamientos: true,
        notasClinicas: {
          include: {
            autor: {
              select: { id: true, nombre: true, apellido: true, email: true }
            }
          },
          orderBy: { creadoEn: 'asc' }
        },
        colaboradores: {
          include: {
            medico: {
              select: { id: true, nombre: true, apellido: true, email: true }
            }
          }
        },
        adjuntos: true
      },
      orderBy: { fecha: 'desc' }
    });

    // Descifrar campos sensibles antes de devolver
    const result = consultas.map(c => ({
      ...c,
      motivo: c.motivo ? decrypt(c.motivo) : null,
      sintomas: c.sintomas ? decrypt(c.sintomas) : null,
      observaciones: c.observaciones ? decrypt(c.observaciones) : null,
      diagnosticos: c.diagnosticos ? c.diagnosticos.map(d => ({
        ...d,
        diagnostico: d.diagnostico ? { ...d.diagnostico, descripcion: d.diagnostico.descripcion ? decrypt(d.diagnostico.descripcion) : null } : null
      })) : [],
      tratamientos: c.tratamientos ? c.tratamientos.map(t => ({
        ...t,
        medicamento: t.medicamento ? decrypt(t.medicamento) : null,
        dosis: t.dosis ? decrypt(t.dosis) : null,
        frecuencia: t.frecuencia ? decrypt(t.frecuencia) : null,
        duracion: t.duracion ? decrypt(t.duracion) : null,
        indicaciones: t.indicaciones ? decrypt(t.indicaciones) : null
      })) : [],
      notasClinicas: c.notasClinicas ? c.notasClinicas.map(n => ({
        ...n,
        contenido: n.contenido ? decrypt(n.contenido) : null
      })) : [],
      adjuntos: c.adjuntos ? c.adjuntos.map(a => ({ id: a.id, mimeType: a.mimeType, size: a.size, creadoEn: a.creadoEn })) : []
    }));

    res.json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Invitar a un médico colaborador a una consulta clínica específica.
 */
const addColaborador = async (req, res, next) => {
  try {
    const consultaId = req.params.id;
    const { medicoId } = req.body;

    if (!medicoId) {
      return res.status(400).json({ error: 'ID de médico colaborador requerido.' });
    }

    // Verificar si la consulta existe
    const consulta = await prisma.consulta.findUnique({
      where: { id: consultaId }
    });

    if (!consulta) {
      return res.status(404).json({ error: 'Consulta no encontrada.' });
    }

    // Verificar que el médico colaborador existe
    const colaborador = await prisma.usuario.findUnique({
      where: { id: medicoId }
    });

    if (!colaborador || colaborador.rol !== 'MEDICO') {
      return res.status(400).json({ error: 'El ID de médico provisto no corresponde a un médico registrado.' });
    }

    // Crear la relación de colaboración
    const colaboracion = await prisma.colaboradorConsulta.create({
      data: {
        consultaId,
        medicoId
      },
      include: {
        medico: { select: { id: true, nombre: true, apellido: true, email: true } }
      }
    });

    // Auditoría
    await prisma.auditoria.create({
      data: {
        accion: 'AGREGAR_COLABORADOR_CONSULTA',
        detalles: `Médico ID ${req.userId} añadió como colaborador al Médico ID ${medicoId} en la consulta ID: ${consultaId}`,
        ipAddress: req.ip || '127.0.0.1',
        usuarioId: req.userId
      }
    }).catch(err => console.error('Audit failed:', err.message));

    res.status(201).json(colaboracion);
  } catch (error) {
    // Si ya colaboraba (violación de @@unique), controlamos el error
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'El médico ya es colaborador de esta consulta.' });
    }
    next(error);
  }
};

/**
 * Registrar una nota de evolución clínica para una consulta.
 */
const createNotaClinica = async (req, res, next) => {
  try {
    const consultaId = req.params.id;
    const data = notaClinicaSchema.parse(req.body);
    const autorId = req.userId;

    // Verificar si la consulta existe
    const consulta = await prisma.consulta.findUnique({
      where: { id: consultaId }
    });

    if (!consulta) {
      return res.status(404).json({ error: 'Consulta no encontrada.' });
    }

    const nota = await prisma.notaClinica.create({
      data: {
        contenido: encrypt(data.contenido),
        consultaId,
        autorId
      },
      include: {
        autor: { select: { id: true, nombre: true, apellido: true, email: true } }
      }
    });

    // Decrypt before returning
    const notaRes = { ...nota, contenido: decrypt(nota.contenido) };

    // Auditoría
    await prisma.auditoria.create({
      data: {
        accion: 'CREAR_NOTA_CLINICA',
        detalles: `Médico ID ${autorId} agregó una nota en la consulta ID: ${consultaId}`,
        ipAddress: req.ip || '127.0.0.1',
        usuarioId: autorId
      }
    }).catch(err => console.error('Audit failed:', err.message));

    res.status(201).json(notaRes);
  } catch (error) {
    next(error);
  }
};

/**
 * Adjuntos: subir, listar, descargar y eliminar
 */
const uploadAttachment = async (req, res, next) => {
  try {
    const consultaId = req.params.id;
    if (!req.file) return res.status(400).json({ error: 'Archivo no proporcionado.' });

    const originalName = req.file.originalname;
    const storedPath = req.file.path || path.join(__dirname, '../../uploads', req.file.filename);

    const adjunto = await prisma.adjunto.create({
      data: {
        nombre: encrypt(originalName),
        ruta: storedPath,
        mimeType: req.file.mimetype,
        size: req.file.size,
        consulta: { connect: { id: consultaId } }
      }
    });

    await prisma.auditoria.create({
      data: {
        accion: 'SUBIR_ADJUNTO',
        detalles: `Médico ID ${req.userId} subió adjunto ID ${adjunto.id} a consulta ID ${consultaId}`,
        ipAddress: req.ip || '127.0.0.1',
        usuarioId: req.userId
      }
    }).catch(() => { /* ignore audit failures */ });

    res.status(201).json({ id: adjunto.id, creadoEn: adjunto.creadoEn });
  } catch (error) {
    next(error);
  }
};

const listAttachments = async (req, res, next) => {
  try {
    const consultaId = req.params.id;
    const adjuntos = await prisma.adjunto.findMany({ where: { consultaId } });

    const mapped = adjuntos.map(a => ({ id: a.id, mimeType: a.mimeType, size: a.size, creadoEn: a.creadoEn }));
    res.json(mapped);
  } catch (error) {
    next(error);
  }
};

const downloadAttachment = async (req, res, next) => {
  try {
    const { id: consultaId, attachmentId } = req.params;
    const adjunto = await prisma.adjunto.findUnique({ where: { id: attachmentId } });
    if (!adjunto || adjunto.consultaId !== consultaId) return res.status(404).json({ error: 'Adjunto no encontrado.' });

    const filePath = adjunto.ruta;
    if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'Archivo físico no encontrado.' });

    const originalName = decrypt(adjunto.nombre);
    res.setHeader('Content-Type', adjunto.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${originalName.replace(/"/g, '')}"`);

    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  } catch (error) {
    next(error);
  }
};

const deleteAttachment = async (req, res, next) => {
  try {
    const { id: consultaId, attachmentId } = req.params;
    const adjunto = await prisma.adjunto.findUnique({ where: { id: attachmentId } });
    if (!adjunto || adjunto.consultaId !== consultaId) return res.status(404).json({ error: 'Adjunto no encontrado.' });

    // Eliminar archivo físico
    try {
      if (fs.existsSync(adjunto.ruta)) fs.unlinkSync(adjunto.ruta);
    } catch (e) {
      console.error('Error eliminando archivo físico:', e.message);
    }

    await prisma.adjunto.delete({ where: { id: attachmentId } });

    await prisma.auditoria.create({
      data: {
        accion: 'ELIMINAR_ADJUNTO',
        detalles: `Médico ID ${req.userId} eliminó adjunto ID ${attachmentId} de consulta ID ${consultaId}`,
        ipAddress: req.ip || '127.0.0.1',
        usuarioId: req.userId
      }
    }).catch(() => {});

    res.status(204).end();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createConsulta,
  getPacienteHistorial,
  addColaborador,
  createNotaClinica,
  uploadAttachment,
  listAttachments,
  downloadAttachment,
  deleteAttachment
};

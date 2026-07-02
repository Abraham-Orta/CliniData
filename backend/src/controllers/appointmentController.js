const prisma = require('../config/database');
const { createAppointmentSchema, updateAppointmentSchema } = require('../utils/appointmentValidators');
const { decrypt } = require('../utils/securityHelper');

function decryptPaciente(paciente) {
  if (!paciente) return paciente;
  return {
    ...paciente,
    nombre: decrypt(paciente.nombre),
    apellido: decrypt(paciente.apellido),
    documentoIdentidad: decrypt(paciente.documentoIdentidad),
    telefono: decrypt(paciente.telefono),
    email: decrypt(paciente.email)
  };
}

async function listAppointments(req, res, next) {
  try {
    const { medicoId, pacienteId, since, until } = req.query;
    const where = {};
    if (medicoId) where.medicoId = medicoId;
    if (pacienteId) where.pacienteId = pacienteId;
    if (since || until) where.fechaHora = {};
    if (since) where.fechaHora.gte = new Date(since);
    if (until) where.fechaHora.lte = new Date(until);

    const citas = await prisma.cita.findMany({ 
      where, 
      include: { paciente: true },
      orderBy: { fechaHora: 'asc' } 
    });

    const decrypted = citas.map(cita => ({
      ...cita,
      paciente: decryptPaciente(cita.paciente)
    }));

    res.json(decrypted);
  } catch (err) {
    next(err);
  }
}

async function getAppointment(req, res, next) {
  try {
    const { id } = req.params;
    const cita = await prisma.cita.findUnique({ 
      where: { id },
      include: { paciente: true } 
    });
    if (!cita) return res.status(404).json({ error: 'Cita no encontrada' });
    
    cita.paciente = decryptPaciente(cita.paciente);
    res.json(cita);
  } catch (err) {
    next(err);
  }
}

async function createAppointment(req, res, next) {
  try {
    const parsed = createAppointmentSchema.parse(req.body);
    const cita = await prisma.cita.create({ 
      data: {
        pacienteId: parsed.pacienteId,
        medicoId: parsed.medicoId,
        fechaHora: new Date(parsed.fechaHora),
        duracion: parsed.duracion || null,
        tipo: parsed.tipo || null,
        estado: parsed.estado || 'pendiente',
        notas: parsed.notas || null,
      },
      include: { paciente: true }
    });
    
    cita.paciente = decryptPaciente(cita.paciente);
    res.status(201).json(cita);
  } catch (err) {
    if (err.name === 'ZodError') return res.status(400).json({ error: err.errors });
    next(err);
  }
}

async function updateAppointment(req, res, next) {
  try {
    const { id } = req.params;
    const parsed = updateAppointmentSchema.parse(req.body);
    const data = {};
    if (parsed.fechaHora) data.fechaHora = new Date(parsed.fechaHora);
    if (parsed.duracion !== undefined) data.duracion = parsed.duracion;
    if (parsed.tipo !== undefined) data.tipo = parsed.tipo;
    if (parsed.estado !== undefined) data.estado = parsed.estado;
    if (parsed.notas !== undefined) data.notas = parsed.notas;

    const cita = await prisma.cita.update({ 
      where: { id }, 
      data,
      include: { paciente: true } 
    });
    
    cita.paciente = decryptPaciente(cita.paciente);
    res.json(cita);
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Cita no encontrada' });
    if (err.name === 'ZodError') return res.status(400).json({ error: err.errors });
    next(err);
  }
}

async function deleteAppointment(req, res, next) {
  try {
    const { id } = req.params;
    await prisma.cita.delete({ where: { id } });
    res.status(204).send();
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Cita no encontrada' });
    next(err);
  }
}

module.exports = {
  listAppointments,
  getAppointment,
  createAppointment,
  updateAppointment,
  deleteAppointment,
};

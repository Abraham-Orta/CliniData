const prisma = require('../config/database');
const { waitlistSchema, waitlistUpdateSchema } = require('../utils/waitlistValidators');
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

async function listWaitlist(req, res, next) {
  try {
    const items = await prisma.listaEspera.findMany({
      where: {
        medicoId: req.userId,
        estado: 'esperando'
      },
      include: {
        paciente: true
      },
      orderBy: {
        creadoEn: 'asc'
      }
    });

    // Custom sorting by urgency: alta, media, baja
    const urgencyWeight = { alta: 1, media: 2, baja: 3 };
    items.sort((a, b) => {
      const wa = urgencyWeight[a.urgencia] || 99;
      const wb = urgencyWeight[b.urgencia] || 99;
      if (wa !== wb) return wa - wb;
      return new Date(a.creadoEn) - new Date(b.creadoEn);
    });

    const decryptedItems = items.map(item => ({
      ...item,
      paciente: decryptPaciente(item.paciente)
    }));

    res.json(decryptedItems);
  } catch (err) {
    next(err);
  }
}

async function addToWaitlist(req, res, next) {
  try {
    const parsed = waitlistSchema.parse(req.body);
    const item = await prisma.listaEspera.create({
      data: {
        pacienteId: parsed.pacienteId,
        medicoId: req.userId,
        urgencia: parsed.urgencia,
        tipoRequerido: parsed.tipoRequerido || null,
        notas: parsed.notas || null
      },
      include: {
        paciente: true
      }
    });
    
    item.paciente = decryptPaciente(item.paciente);
    res.status(201).json(item);
  } catch (err) {
    if (err.name === 'ZodError') return res.status(400).json({ error: err.errors });
    next(err);
  }
}

async function updateWaitlistItem(req, res, next) {
  try {
    const { id } = req.params;
    const parsed = waitlistUpdateSchema.parse(req.body);
    
    // Check ownership
    const existing = await prisma.listaEspera.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Registro no encontrado' });
    if (existing.medicoId !== req.userId) {
      return res.status(403).json({ error: 'No autorizado para modificar este registro' });
    }

    const data = {};
    if (parsed.urgencia !== undefined) data.urgencia = parsed.urgencia;
    if (parsed.tipoRequerido !== undefined) data.tipoRequerido = parsed.tipoRequerido;
    if (parsed.notas !== undefined) data.notas = parsed.notas;
    if (parsed.estado !== undefined) data.estado = parsed.estado;

    const item = await prisma.listaEspera.update({
      where: { id },
      data,
      include: { paciente: true }
    });
    
    item.paciente = decryptPaciente(item.paciente);
    res.json(item);
  } catch (err) {
    if (err.name === 'ZodError') return res.status(400).json({ error: err.errors });
    next(err);
  }
}

async function removeFromWaitlist(req, res, next) {
  try {
    const { id } = req.params;
    const existing = await prisma.listaEspera.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Registro no encontrado' });
    if (existing.medicoId !== req.userId) {
      return res.status(403).json({ error: 'No autorizado para modificar este registro' });
    }

    // Soft delete by updating status to 'cancelado'
    await prisma.listaEspera.update({
      where: { id },
      data: { estado: 'cancelado' }
    });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listWaitlist,
  addToWaitlist,
  updateWaitlistItem,
  removeFromWaitlist
};

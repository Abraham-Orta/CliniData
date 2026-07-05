const { patientSchema } = require('../utils/patientValidators');
const prisma = require('../config/database');
const { generateBlindIndex, encrypt } = require('../utils/securityHelper');

function decryptPatient(p) {
  if (!p) return null;
  // Note: Prisma extension in database.js already decrypts all encrypted fields.
  // This function only needs to compute derived fields (teamCount).
  const allColabs = new Set();
  if (p.consultas) {
    p.consultas.forEach(c => {
      if (c.colaboradores) {
        c.colaboradores.forEach(col => allColabs.add(col.medicoId));
      }
    });
  }
  return {
    ...p,
    teamCount: 1 + allColabs.size
  };
}

const getAllPatients = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const search = (req.query.search || '').trim();
    const medicoId = req.userId;
    const rol = req.userRole;

    if (rol === 'ADMIN') {
      return res.status(403).json({
        error: 'Acceso denegado. Los administradores no tienen permitido visualizar expedientes o listas de pacientes.'
      });
    }

    // Base ReBAC access query
    const accessQuery = {
      OR: [
        { medicoPrincipalId: medicoId },
        { consultas: { some: { medicoId: medicoId } } },
        { consultas: { some: { colaboradores: { some: { medicoId: medicoId } } } } }
      ]
    };

    // Optional filters
    const filters = {};
    if (req.query.genero) {
      filters.genero = req.query.genero;
    }
    if (req.query.fechaNacimiento) {
      const d = new Date(req.query.fechaNacimiento);
      if (!Number.isNaN(d.getTime())) {
        // Normalize to date (Prisma will handle date types)
        filters.fechaNacimiento = d;
      }
    }

    const baseWhere = { AND: [accessQuery] };
    if (Object.keys(filters).length) baseWhere.AND.push(filters);

    let patients = [];
    let total = 0;

    if (search) {
      // Try document (blind index) match first - fast and exact
      const searchDniHash = generateBlindIndex(search);
      const matchedPatient = await prisma.paciente.findFirst({
        where: { AND: [baseWhere, { documentoIdentidadHash: searchDniHash }] },
        include: { consultas: { include: { colaboradores: true } } }
      });

      if (matchedPatient) {
        patients = [decryptPatient(matchedPatient)];
        total = 1;
      } else {
        // No exact doc match: search by nombre/apellido in decrypted data.
        // To avoid decrypting entire DB, restrict by baseWhere (access + filters) and cap results to a reasonable max.
        const MAX_DECRYPT = 1000; // safety cap
        const allAccessible = await prisma.paciente.findMany({ where: baseWhere, orderBy: { creadoEn: 'desc' }, take: MAX_DECRYPT, include: { consultas: { include: { colaboradores: true } } } });

        const decrypted = allAccessible.map(decryptPatient);
        const searchTerm = search.toLowerCase();
        const filtered = decrypted.filter(p => {
          const nombre = p.nombre ? p.nombre.toLowerCase() : '';
          const apellido = p.apellido ? p.apellido.toLowerCase() : '';
          const documento = p.documentoIdentidad ? p.documentoIdentidad.toLowerCase() : '';
          return nombre.includes(searchTerm) || apellido.includes(searchTerm) || documento.includes(searchTerm);
        });

        total = filtered.length;
        const startIndex = (page - 1) * limit;
        patients = filtered.slice(startIndex, startIndex + limit);
      }
    } else {
      // No free-text search: apply pagination server-side using baseWhere
      const skip = (page - 1) * limit;
      const [rows, count] = await Promise.all([
        prisma.paciente.findMany({ where: baseWhere, skip, take: limit, orderBy: { creadoEn: 'desc' }, include: { consultas: { include: { colaboradores: true } } } }),
        prisma.paciente.count({ where: baseWhere })
      ]);

      patients = rows.map(decryptPatient);
      total = count;
    }

    res.json({ data: patients, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } });
  } catch (err) {
    next(err);
  }
};

const getPatient = async (req, res, next) => {
  try {
    // validatePatientAccess middleware should have attached req.paciente decrypted
    if (req.paciente) {
      return res.json(req.paciente);
    }

    const patient = await prisma.paciente.findUnique({ where: { id: req.params.id }, include: { consultas: { include: { colaboradores: true } } } });
    if (!patient) return res.status(404).json({ error: 'Paciente no encontrado.' });

    res.json(decryptPatient(patient));
  } catch (err) {
    next(err);
  }
};

const createPatient = async (req, res, next) => {
  try {
    if (req.userRole === 'ADMIN') return res.status(403).json({ error: 'Los administradores no pueden registrar expedientes clínicos.' });

    const data = patientSchema.parse(req.body);
    const medicoId = req.userId;
    const clinicaId = req.user?.clinicaId || req.userClinicaId || null;

    const dniHash = generateBlindIndex(data.documentoIdentidad);
    const existing = await prisma.paciente.findUnique({ where: { documentoIdentidadHash: dniHash } }).catch(() => null);
    if (existing) return res.status(400).json({ error: 'Ya existe un paciente registrado con este documento de identidad.' });

    // Encrypt sensitive fields
    const toStore = {
      nombre: encrypt(data.nombre),
      apellido: encrypt(data.apellido),
      documentoIdentidad: encrypt(data.documentoIdentidad),
      documentoIdentidadHash: dniHash,
      telefono: data.telefono ? encrypt(data.telefono) : null,
      email: data.email ? encrypt(data.email) : null,
      fechaNacimiento: data.fechaNacimiento || null,
      genero: data.genero || null,
      contactoEmergencia: data.contactoEmergencia || null,
      telefonoEmergencia: data.telefonoEmergencia || null,
      nombreTutor: data.nombreTutor ? encrypt(data.nombreTutor) : null,
      dniTutor: data.dniTutor ? encrypt(data.dniTutor) : null,
      clinicaId,
      medicoPrincipalId: medicoId
    };

    const patient = await prisma.paciente.create({ data: toStore });

    await prisma.auditoria.create({ data: { accion: 'CREAR_PACIENTE', detalles: `Médico creó el expediente del paciente ID: ${patient.id}`, ipAddress: req.ip || '127.0.0.1', usuarioId: medicoId } }).catch(() => null);

    res.status(201).json(decryptPatient(patient));
  } catch (err) {
    next(err);
  }
};

const updatePatient = async (req, res, next) => {
  try {
    const data = patientSchema.partial().parse(req.body);
    const patientId = req.params.id;

    if (data.documentoIdentidad) {
      const dniHash = generateBlindIndex(data.documentoIdentidad);
      const existing = await prisma.paciente.findUnique({ where: { documentoIdentidadHash: dniHash } }).catch(() => null);
      if (existing && existing.id !== patientId) return res.status(400).json({ error: 'Ya existe otro paciente con este documento de identidad.' });
      data.documentoIdentidadHash = dniHash;
      data.documentoIdentidad = encrypt(data.documentoIdentidad);
    }

    // Encrypt other sensitive fields if present
    if (data.nombre) data.nombre = encrypt(data.nombre);
    if (data.apellido) data.apellido = encrypt(data.apellido);
    if (data.telefono) data.telefono = encrypt(data.telefono);
    if (data.email) data.email = encrypt(data.email);
    if (data.nombreTutor) data.nombreTutor = encrypt(data.nombreTutor);
    if (data.dniTutor) data.dniTutor = encrypt(data.dniTutor);

    const patient = await prisma.paciente.update({ where: { id: patientId }, data });

    await prisma.auditoria.create({ data: { accion: 'ACTUALIZAR_PACIENTE', detalles: `Médico actualizó el expediente del paciente ID: ${patient.id}`, ipAddress: req.ip || '127.0.0.1', usuarioId: req.userId } }).catch(() => null);

    res.json(decryptPatient(patient));
  } catch (err) {
    next(err);
  }
};

const deletePatient = async (req, res, next) => {
  try {
    const patientId = req.params.id;
    const existing = await prisma.paciente.findUnique({ where: { id: patientId } });
    if (!existing) return res.status(404).json({ error: 'Paciente no encontrado.' });

    await prisma.paciente.delete({ where: { id: patientId } });

    await prisma.auditoria.create({ data: { accion: 'ELIMINAR_PACIENTE', detalles: `Administrador eliminó físicamente el expediente del paciente ID: ${patientId}`, ipAddress: req.ip || '127.0.0.1', usuarioId: req.userId } }).catch(() => null);

    res.status(204).end();
  } catch (err) {
    next(err);
  }
};

module.exports = { getAllPatients, getPatient, createPatient, updatePatient, deletePatient };

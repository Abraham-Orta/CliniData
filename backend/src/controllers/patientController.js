const { patientSchema } = require('../utils/patientValidators');
const prisma = require('../config/database');
const { generateBlindIndex, encrypt, decrypt } = require('../utils/securityHelper');

function decryptPatient(p) {
  if (!p) return p;
  return {
    ...p,
    nombre: decrypt(p.nombre),
    apellido: decrypt(p.apellido),
    documentoIdentidad: decrypt(p.documentoIdentidad),
    telefono: decrypt(p.telefono),
    email: decrypt(p.email)
  };
}

const getAllPatients = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const search = req.query.search || '';
    const medicoId = req.userId;
    const rol = req.userRole;

    if (rol === 'ADMIN') {
      return res.status(403).json({
        error: 'Acceso denegado. Los administradores no tienen permitido visualizar expedientes o listas de pacientes.'
      });
    }

    const accessQuery = {
      OR: [
        { medicoPrincipalId: medicoId },
        { consultas: { some: { medicoId: medicoId } } },
        { consultas: { some: { colaboradores: { some: { medicoId: medicoId } } } } }
      ]
    };

    let patients = [];
    let total = 0;

    if (search) {
      const searchDniHash = generateBlindIndex(search);
      const matchedPatient = await prisma.paciente.findFirst({
        where: { AND: [accessQuery, { documentoIdentidadHash: searchDniHash }] }
      });

      if (matchedPatient) {
        patients = [decryptPatient(matchedPatient)];
        total = 1;
      } else {
        const allAccessible = await prisma.paciente.findMany({ where: accessQuery, orderBy: { creadoEn: 'desc' } });

        const decrypted = allAccessible.map(decryptPatient);
        const searchTerm = search.toLowerCase();
        const filtered = decrypted.filter(p => {
          const nombre = p.nombre ? p.nombre.toLowerCase() : '';
          const apellido = p.apellido ? p.apellido.toLowerCase() : '';
          return nombre.includes(searchTerm) || apellido.includes(searchTerm);
        });

        total = filtered.length;
        const startIndex = (page - 1) * limit;
        patients = filtered.slice(startIndex, startIndex + limit);
      }
    } else {
      const skip = (page - 1) * limit;
      const [rows, count] = await Promise.all([
        prisma.paciente.findMany({ where: accessQuery, skip, take: limit, orderBy: { creadoEn: 'desc' } }),
        prisma.paciente.count({ where: accessQuery })
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

    const patient = await prisma.paciente.findUnique({ where: { id: req.params.id } });
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

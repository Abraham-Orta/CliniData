const express = require('express');
const authMiddleware = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const prisma = require('../config/database');

const router = express.Router();

// 1. Obtener datos del usuario autenticado actual
router.get('/me', authMiddleware, async (req, res, next) => {
  try {
    const user = await prisma.usuario.findUnique({
      where: { id: req.userId },
      select: {
        id: true,
        email: true,
        nombre: true,
        apellido: true,
        rol: true,
        activo: true,
        clinicaId: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }

    res.json(user);
  } catch (error) {
    next(error);
  }
});

// 1.5. [ADMIN y MEDICO] Listar todos los médicos activos de la misma clínica (colegas)
router.get('/doctors', authMiddleware, authorize(['ADMIN', 'MEDICO', 'ENFERMERO']), async (req, res, next) => {
  try {
    const doctors = await prisma.usuario.findMany({
      where: {
        rol: 'MEDICO',
        activo: true,
        clinicaId: req.user.clinicaId,
        id: { not: req.userId }
      },
      select: {
        id: true,
        nombre: true,
        apellido: true,
        email: true
      },
      orderBy: { nombre: 'asc' }
    });

    res.json(doctors);
  } catch (error) {
    next(error);
  }
});

// 2. [ADMIN ONLY] Listar todos los usuarios médicos del sistema
router.get('/', authMiddleware, authorize(['ADMIN']), async (req, res, next) => {
  try {
    const usuarios = await prisma.usuario.findMany({
      where: { rol: 'MEDICO' },
      select: {
        id: true,
        email: true,
        nombre: true,
        apellido: true,
        rol: true,
        activo: true,
        creadoEn: true
      },
      orderBy: { creadoEn: 'desc' }
    });

    res.json(usuarios);
  } catch (error) {
    next(error);
  }
});

// 3. [ADMIN ONLY] Activar o desactivar un médico
router.put('/:id/status', authMiddleware, authorize(['ADMIN']), async (req, res, next) => {
  try {
    const { activo } = req.body;

    if (activo === undefined || typeof activo !== 'boolean') {
      return res.status(400).json({ error: 'El campo "activo" (booleano) es requerido.' });
    }

    const targetUser = await prisma.usuario.findUnique({
      where: { id: req.params.id }
    });

    if (!targetUser) {
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }

    if (targetUser.rol === 'ADMIN') {
      return res.status(400).json({ error: 'No se puede desactivar a un usuario administrador.' });
    }

    const usuarioActualizado = await prisma.usuario.update({
      where: { id: req.params.id },
      data: { activo },
      select: { id: true, email: true, activo: true }
    });

    // Auditoría
    await prisma.auditoria.create({
      data: {
        accion: activo ? 'ACTIVAR_MEDICO' : 'DESACTIVAR_MEDICO',
        detalles: `Administrador cambió estado de ${usuarioActualizado.email} a activo=${activo}`,
        ipAddress: req.ip || '127.0.0.1',
        usuarioId: req.userId
      }
    }).catch(err => console.error('Audit failed:', err.message));

    res.json(usuarioActualizado);
  } catch (error) {
    next(error);
  }
});

module.exports = router;

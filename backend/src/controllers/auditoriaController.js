const prisma = require('../config/database');

/**
 * Listado paginado de la bitácora de auditorías del sistema.
 * Solo accesible por Administradores.
 */
const getAllAuditorias = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    const [auditorias, total] = await Promise.all([
      prisma.auditoria.findMany({
        skip,
        take: limit,
        orderBy: { fecha: 'desc' },
        include: {
          usuario: {
            select: { id: true, email: true, nombre: true, apellido: true, rol: true }
          }
        }
      }),
      prisma.auditoria.count()
    ]);

    res.json({
      data: auditorias.map(a => ({
        id: a.id,
        accion: a.accion,
        detalles: a.detalles,
        ipAddress: a.ipAddress,
        fecha: a.fecha,
        usuario: a.usuario ? {
          id: a.usuario.id,
          email: a.usuario.email,
          nombre: `${a.usuario.nombre} ${a.usuario.apellido}`,
          rol: a.usuario.rol
        } : null
      })),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllAuditorias
};

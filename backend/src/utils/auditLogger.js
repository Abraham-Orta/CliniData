const prisma = require('../config/database');

/**
 * Centralised, fire-and-forget audit logger.
 *
 * Usage:
 *   audit(req, 'ACCION', 'Descripción opcional');
 *
 * Never throws — audit failures must never break the main request flow.
 *
 * @param {import('express').Request} req
 * @param {string} action  - Short uppercase action code (e.g. 'VER_HISTORIAL_PACIENTE')
 * @param {string} [details] - Human-readable detail string
 * @param {string} [overrideUserId] - Use when req.userId is not yet set (e.g. failed login)
 */
async function audit(req, action, details, overrideUserId) {
  try {
    await prisma.auditoria.create({
      data: {
        accion: action,
        detalles: details || null,
        ipAddress: req.ip || req.socket?.remoteAddress || '0.0.0.0',
        usuarioId: overrideUserId || req.userId || null,
      },
    });
  } catch (err) {
    // Audit must never crash the application
    console.error(`[audit] Failed to write log for action "${action}":`, err.message);
  }
}

module.exports = { audit };

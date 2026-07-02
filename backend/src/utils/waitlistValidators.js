const { z } = require('zod');

const waitlistSchema = z.object({
  pacienteId: z.string().uuid(),
  urgencia: z.enum(['alta', 'media', 'baja']).default('media'),
  tipoRequerido: z.string().max(50).optional(),
  notas: z.string().max(500).optional()
});

const waitlistUpdateSchema = z.object({
  urgencia: z.enum(['alta', 'media', 'baja']).optional(),
  tipoRequerido: z.string().max(50).optional(),
  notas: z.string().max(500).optional(),
  estado: z.enum(['esperando', 'atendido', 'cancelado']).optional()
});

module.exports = { waitlistSchema, waitlistUpdateSchema };

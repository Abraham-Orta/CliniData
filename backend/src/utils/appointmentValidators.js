const { z } = require('zod');

const createAppointmentSchema = z.object({
  pacienteId: z.string().uuid('ID de paciente inválido'),
  medicoId: z.string().uuid('ID de médico inválido'),
  fechaHora: z.string().refine(v => !isNaN(Date.parse(v)), { message: 'fechaHora inválida' }),
  duracion: z.number().int().min(5).max(480).optional(),
  tipo: z.string().max(50).optional(),
  estado: z.enum(['pendiente','confirmada','cancelada','completada']).optional(),
  notas: z.string().max(1000).optional().nullable(),
});

const updateAppointmentSchema = z.object({
  fechaHora: z.string().refine(v => !isNaN(Date.parse(v)), { message: 'fechaHora inválida' }).optional(),
  duracion: z.number().int().min(5).max(480).optional(),
  tipo: z.string().max(50).optional(),
  estado: z.enum(['pendiente','confirmada','cancelada','completada']).optional(),
  notas: z.string().max(1000).optional().nullable(),
});

module.exports = {
  createAppointmentSchema,
  updateAppointmentSchema
};

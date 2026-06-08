const { z } = require('zod');

const tratamientoSchema = z.object({
  medicamento: z.string().min(1, 'El nombre del medicamento es requerido').max(100),
  dosis: z.string().min(1, 'La dosis es requerida').max(50),
  frecuencia: z.string().min(1, 'La frecuencia es requerida').max(50),
  duracion: z.string().min(1, 'La duración es requerida').max(50),
  indicaciones: z.string().max(500).optional().nullable()
});

const consultaSchema = z.object({
  pacienteId: z.string().uuid('ID de paciente inválido'),
  motivo: z.string().min(3, 'El motivo de consulta es requerido').max(250),
  sintomas: z.string().max(1000).optional().nullable(),
  presionArterial: z.string().max(20).optional().nullable(),
  temperatura: z.number().min(30).max(45).optional().nullable(),
  frecuenciaCardiaca: z.number().int().min(20).max(300).optional().nullable(),
  peso: z.number().min(1).max(500).optional().nullable(),
  observaciones: z.string().max(2000).optional().nullable(),
  diagnosticos: z.array(z.string()).optional(), // Códigos CIE-10 o IDs
  tratamientos: z.array(tratamientoSchema).optional(),
  colaboradores: z.array(z.string().uuid('ID de médico colaborador inválido')).optional()
});

const notaClinicaSchema = z.object({
  contenido: z.string().min(1, 'El contenido de la nota no puede estar vacío').max(1000)
});

module.exports = {
  consultaSchema,
  notaClinicaSchema
};

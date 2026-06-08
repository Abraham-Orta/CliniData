const { z } = require('zod');

const patientSchema = z.object({
  nombre: z.string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(50, 'El nombre no puede exceder los 50 caracteres'),
  apellido: z.string()
    .min(2, 'El apellido debe tener al menos 2 caracteres')
    .max(50, 'El apellido no puede exceder los 50 caracteres'),
  documentoIdentidad: z.string()
    .min(5, 'El documento de identidad debe tener al menos 5 caracteres')
    .max(20, 'El documento de identidad no puede exceder los 20 caracteres'),
  fechaNacimiento: z.preprocess((arg) => {
    if (typeof arg === 'string' && arg !== '') {
      return new Date(arg);
    }
    return arg;
  }, z.date().optional().nullable()),
  genero: z.enum(['MASCULINO', 'FEMENINO', 'OTRO']).optional().nullable(),
  telefono: z.string().max(20).optional().nullable(),
  email: z.string().email('Email de paciente inválido').or(z.literal('')).optional().nullable(),
  contactoEmergencia: z.string().max(100).optional().nullable(),
  telefonoEmergencia: z.string().max(20).optional().nullable(),
  nombreTutor: z.string().max(100).optional().nullable(),
  dniTutor: z.string().max(20).optional().nullable()
});

module.exports = { patientSchema };

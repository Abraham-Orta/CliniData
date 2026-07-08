const { z } = require('zod');

const userSchema = z.object({
  email: z.string().email('Email inválido'),
  nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(50),
  apellido: z.string().min(2, 'El apellido debe tener al menos 2 caracteres').max(50),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  rol: z.enum(['ADMIN', 'MEDICO', 'ENFERMERO']).optional()
});

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Contraseña requerida')
});

module.exports = {
  userSchema,
  loginSchema
};

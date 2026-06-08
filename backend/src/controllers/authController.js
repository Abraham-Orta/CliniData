const bcrypt = require('bcryptjs');
const prisma = require('../config/database');
const { generateToken } = require('../utils/jwt');
const { userSchema, loginSchema } = require('../utils/validators');

/**
 * Registro de un nuevo Usuario (por defecto rol MEDICO).
 */
const register = async (req, res, next) => {
  try {
    const data = userSchema.parse(req.body);

    const existing = await prisma.usuario.findUnique({
      where: { email: data.email }
    });

    if (existing) {
      return res.status(400).json({ error: 'El usuario ya existe con este correo electrónico.' });
    }

    // Buscar la primera clínica para asociar al usuario
    let clinica = await prisma.clinica.findFirst();
    if (!clinica) {
      clinica = await prisma.clinica.create({
        data: {
          nombre: 'Clínica de Salud Familiar Local',
          direccion: 'Dirección por defecto'
        }
      });
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);
    const userRole = data.rol || 'MEDICO';

    const usuario = await prisma.usuario.create({
      data: {
        email: data.email,
        nombre: data.nombre,
        apellido: data.apellido,
        password: hashedPassword,
        rol: userRole,
        activo: true,
        clinicaId: clinica.id
      },
      select: {
        id: true,
        email: true,
        nombre: true,
        apellido: true,
        rol: true,
        activo: true
      }
    });

    // Auditoría
    await prisma.auditoria.create({
      data: {
        accion: 'REGISTRO_USUARIO',
        detalles: `Usuario registrado: ${usuario.email} con rol ${usuario.rol}`,
        ipAddress: req.ip || '127.0.0.1',
        usuarioId: usuario.id
      }
    }).catch(err => console.error('Audit failed:', err.message));

    const token = generateToken(usuario.id, usuario.rol, usuario.clinicaId);
    res.status(201).json({ user: usuario, token });
  } catch (error) {
    next(error);
  }
};

/**
 * Inicio de sesión (Login) de Usuarios.
 */
const login = async (req, res, next) => {
  try {
    const data = loginSchema.parse(req.body);

    const usuario = await prisma.usuario.findUnique({
      where: { email: data.email }
    });

    if (!usuario || !await bcrypt.compare(data.password, usuario.password)) {
      return res.status(401).json({ error: 'Credenciales inválidas.' });
    }

    if (!usuario.activo) {
      return res.status(403).json({ error: 'Usuario inactivo. Contacte al administrador.' });
    }

    // Auditoría
    await prisma.auditoria.create({
      data: {
        accion: 'INICIO_SESION',
        detalles: `Usuario inició sesión: ${usuario.email}`,
        ipAddress: req.ip || '127.0.0.1',
        usuarioId: usuario.id
      }
    }).catch(err => console.error('Audit failed:', err.message));

    const token = generateToken(usuario.id, usuario.rol, usuario.clinicaId);
    res.json({
      user: {
        id: usuario.id,
        email: usuario.email,
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        rol: usuario.rol
      },
      token
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login };

const { verifyToken } = require('../utils/jwt');
const prisma = require('../config/database');

/**
 * Middleware para validar el token JWT e inyectar el usuario autenticado (Usuario) en la petición.
 */
const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : authHeader;

  if (!token) {
    return res.status(401).json({ error: 'Token no proporcionado o formato inválido. Use Bearer <token>' });
  }

  try {
    const decoded = verifyToken(token);
    req.userId = decoded.userId;
    req.userRole = decoded.role;

    // Consultamos el usuario completo de la base de datos (Modelo relacional: Usuario)
    const usuario = await prisma.usuario.findUnique({
      where: { id: decoded.userId }
    });

    if (!usuario) {
      return res.status(401).json({ error: 'Usuario no encontrado en el sistema.' });
    }

    if (!usuario.activo) {
      return res.status(403).json({ error: 'El usuario se encuentra inactivo. Contacte al administrador.' });
    }

    // Inyectamos el usuario completo en req.user
    req.user = usuario;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token inválido o expirado.' });
  }
};

module.exports = authMiddleware;

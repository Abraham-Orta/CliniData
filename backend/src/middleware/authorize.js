/**
 * Middleware de control de acceso basado en roles (RBAC).
 * Valida si el rol del usuario autenticado (inyectado en req.userRole) está dentro de los roles permitidos.
 */
module.exports = (allowedRoles = []) => {
  return (req, res, next) => {
    const role = req.userRole || 'USER';

    // Si se trata de un ADMIN y no está explícitamente permitido, aplicamos la política de segregación
    if (role === 'ADMIN' && !allowedRoles.includes('ADMIN')) {
      return res.status(403).json({
        error: 'Acceso denegado. Los administradores no tienen permitido visualizar expedientes clínicos.'
      });
    }
    
    if (allowedRoles.length === 0 || allowedRoles.includes(role)) {
      return next();
    }
    
    return res.status(403).json({
      error: 'Acceso denegado. No posee los privilegios requeridos para realizar esta acción.'
    });
  };
};

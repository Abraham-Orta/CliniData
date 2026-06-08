const jwt = require('jsonwebtoken');

const generateToken = (userId, role, clinicaId) => {
  const payload = { userId, role };
  if (clinicaId) payload.clinicaId = clinicaId;
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRY || '7d'
  });
};

const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid token');
  }
};

module.exports = {
  generateToken,
  verifyToken
};

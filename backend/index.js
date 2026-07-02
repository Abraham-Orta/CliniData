/* eslint-disable no-process-exit */
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const prisma = require('./src/config/database');
const errorHandler = require('./src/middleware/errorHandler');

const swaggerUi = require('swagger-ui-express');
const YAML = require('js-yaml');
const fs = require('fs');
const path = require('path');

const app = express();

// --- CAPA 1 SEGURIDAD: Cabeceras de seguridad HTTP (Helmet) y CORS ---
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// --- CAPA 4 SEGURIDAD: Limitar tamaño de payload (mitigar ataques DoS) ---
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// --- CAPA 2 SEGURIDAD: Rate Limiting para evitar fuerza bruta y abuso ---
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // Limita cada IP a 100 peticiones por ventana
  message: { error: 'Demasiadas peticiones desde esta dirección IP. Intente de nuevo en 15 minutos.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 20, // Limita a 20 intentos de login/registro cada 15 minutos
  message: { error: 'Demasiados intentos de autenticación. Intente de nuevo en 15 minutos.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Aplicar rate limiting
app.use('/api/', generalLimiter);
app.use('/api/auth/', authLimiter);

// --- Rutas del Sistema ---
app.use('/api/auth', require('./src/routes/auth'));
app.use('/api/users', require('./src/routes/users'));
app.use('/api/patients', require('./src/routes/patients'));
app.use('/api/consultas', require('./src/routes/consultas'));
app.use('/api/appointments', require('./src/routes/appointments'));
app.use('/api/waitlist', require('./src/routes/waitlist'));
app.use('/api/dashboard', require('./src/routes/dashboard'));
app.use('/api/auditorias', require('./src/routes/auditorias'));

// Swagger UI (OpenAPI docs)
try {
  const openapiPath = path.join(__dirname, 'openapi.yaml');
  if (fs.existsSync(openapiPath)) {
    const openapiDoc = YAML.load(fs.readFileSync(openapiPath, 'utf8'));
    app.use('/docs', swaggerUi.serve, swaggerUi.setup(openapiDoc));
    console.log('Mounted Swagger UI at /docs');
  } else {
    console.warn('openapi.yaml not found; skipping Swagger UI mount.');
  }
} catch (err) {
  console.warn('Failed to mount Swagger UI:', err.message);
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK' });
});

// Manejador global de errores
app.use(errorHandler);

// --- CAPA 2 SEGURIDAD: Validación de JWT_SECRET y ENCRYPTION_KEY al arrancar ---
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET;
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;

if (!JWT_SECRET || JWT_SECRET === 'change_this_secret') {
  if (process.env.NODE_ENV === 'production') {
    console.error('CRITICAL ERROR: JWT_SECRET must be set to a strong value in production!');
    process.exit(1);
  } else {
    console.warn('WARNING: JWT_SECRET is using the default development secret. Change it in production.');
  }
}

if (!ENCRYPTION_KEY) {
  if (process.env.NODE_ENV === 'production') {
    console.error('CRITICAL ERROR: ENCRYPTION_KEY must be set in production!');
    process.exit(1);
  } else {
    console.warn('WARNING: ENCRYPTION_KEY is not set. Encrypt/decrypt operations will fail or be insecure in production.');
  }
} else if (ENCRYPTION_KEY.length < 32) {
  console.warn('WARNING: ENCRYPTION_KEY length is less than 32 characters; consider using a 32-byte key for AES-256.');
}

if (require.main === module) {
  const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });

  // Apagado elegante (Graceful Shutdown)
  process.on('SIGINT', async () => {
    console.log('Shutting down server gracefully...');
    await prisma.$disconnect();
    server.close(() => {
      console.log('Server closed. Database disconnected.');
      process.exit(0);
    });
  });
}

module.exports = app;

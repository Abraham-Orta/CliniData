const request = require('supertest');
const app = require('../index');
const prisma = require('../src/config/database');
const bcrypt = require('bcryptjs');

describe('Pruebas de Autenticación (Auth API)', () => {
  let clinicaId;

  beforeAll(async () => {
    // Limpiar base de datos antes de las pruebas de auth
    await prisma.auditoria.deleteMany();
    await prisma.colaboradorConsulta.deleteMany();
    await prisma.notaClinica.deleteMany();
    await prisma.tratamiento.deleteMany();
    await prisma.consultaDiagnostico.deleteMany();
    await prisma.consulta.deleteMany();
    await prisma.paciente.deleteMany();
    await prisma.usuario.deleteMany();
    await prisma.clinica.deleteMany();

    // Crear clínica por defecto
    const clinica = await prisma.clinica.create({
      data: {
        nombre: 'Clínica de Prueba Auth',
        direccion: 'Calle Test 123'
      }
    });
    clinicaId = clinica.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  const testUser = {
    email: 'medico.test@example.com',
    nombre: 'Elena',
    apellido: 'Test',
    password: 'password123',
    rol: 'MEDICO'
  };

  test('Debería registrar un nuevo usuario con éxito', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(testUser);

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user).toHaveProperty('email', testUser.email);
    expect(res.body.user).toHaveProperty('rol', 'MEDICO');
    expect(res.body.user).not.toHaveProperty('password');
  });

  test('Debería fallar al registrar un usuario con email duplicado', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(testUser);

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  test('Debería iniciar sesión correctamente con credenciales válidas', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user).toHaveProperty('email', testUser.email);
    expect(res.body.user).toHaveProperty('rol', 'MEDICO');
  });

  test('Debería fallar al iniciar sesión con contraseña incorrecta', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: 'wrongpassword'
      });

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('error', 'Credenciales inválidas.');
  });
});

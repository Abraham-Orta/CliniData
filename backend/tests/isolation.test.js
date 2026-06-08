const request = require('supertest');
const app = require('../index');
const prisma = require('../src/config/database');
const { generateToken } = require('../src/utils/jwt');
const bcrypt = require('bcryptjs');

describe('Pruebas de Aislamiento Clínico y Relación (ReBAC / RBAC)', () => {
  let clinicaId;
  let adminToken, medicoAToken, medicoBToken;
  let adminId, medicoAId, medicoBId;
  let pacienteId;

  beforeAll(async () => {
    // Limpiar base de datos
    await prisma.auditoria.deleteMany();
    await prisma.colaboradorConsulta.deleteMany();
    await prisma.notaClinica.deleteMany();
    await prisma.tratamiento.deleteMany();
    await prisma.consultaDiagnostico.deleteMany();
    await prisma.consulta.deleteMany();
    await prisma.paciente.deleteMany();
    await prisma.usuario.deleteMany();
    await prisma.clinica.deleteMany();

    // 1. Crear Clínica
    const clinica = await prisma.clinica.create({
      data: { nombre: 'Clínica de Aislamiento', direccion: 'Calle Seguridad 456' }
    });
    clinicaId = clinica.id;

    // 2. Crear Usuarios
    const passHash = await bcrypt.hash('password123', 10);
    
    const admin = await prisma.usuario.create({
      data: { email: 'admin.is@example.com', nombre: 'Admin', apellido: 'Sec', password: passHash, rol: 'ADMIN', clinicaId }
    });
    adminId = admin.id;
    adminToken = generateToken(admin.id, 'ADMIN');

    const medicoA = await prisma.usuario.create({
      data: { email: 'med.a@example.com', nombre: 'Médico', apellido: 'A', password: passHash, rol: 'MEDICO', clinicaId }
    });
    medicoAId = medicoA.id;
    medicoAToken = generateToken(medicoA.id, 'MEDICO');

    const medicoB = await prisma.usuario.create({
      data: { email: 'med.b@example.com', nombre: 'Médico', apellido: 'B', password: passHash, rol: 'MEDICO', clinicaId }
    });
    medicoBId = medicoB.id;
    medicoBToken = generateToken(medicoB.id, 'MEDICO');
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  test('Médico A debería poder registrar un paciente con éxito', async () => {
    const res = await request(app)
      .post('/api/patients')
      .set('Authorization', `Bearer ${medicoAToken}`)
      .send({
        nombre: 'Carlos',
        apellido: 'Santana',
        documentoIdentidad: '87654321B',
        fechaNacimiento: '1970-07-20',
        genero: 'MASCULINO',
        telefono: '555-9876',
        email: 'carlos.santana@example.com'
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    pacienteId = res.body.id;
  });

  test('Administrador NO debería tener permitido listar pacientes', async () => {
    const res = await request(app)
      .get('/api/patients')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(403);
    expect(res.body).toHaveProperty('error');
    expect(res.body.error).toContain('Los administradores no tienen permitido visualizar');
  });

  test('Administrador NO debería tener permitido ver un paciente específico', async () => {
    const res = await request(app)
      .get(`/api/patients/${pacienteId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(403);
    expect(res.body).toHaveProperty('error');
    expect(res.body.error).toContain('Los administradores no tienen permitido visualizar');
  });

  test('Médico B (sin relación) NO debería poder ver el paciente del Médico A', async () => {
    const res = await request(app)
      .get(`/api/patients/${pacienteId}`)
      .set('Authorization', `Bearer ${medicoBToken}`);

    expect(res.status).toBe(403);
    expect(res.body).toHaveProperty('error');
    expect(res.body.error).toContain('No tiene autorización sobre el expediente clínico');
  });

  test('Médico A debería poder registrar una consulta para su paciente', async () => {
    const res = await request(app)
      .post('/api/consultas')
      .set('Authorization', `Bearer ${medicoAToken}`)
      .send({
        pacienteId,
        motivo: 'Chequeo rutinario',
        sintomas: 'Ninguno',
        presionArterial: '120/80',
        temperatura: 36.6,
        frecuenciaCardiaca: 70,
        peso: 75.0,
        observaciones: 'Paciente sano.',
        diagnosticos: [],
        tratamientos: []
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    const consultaId = res.body.id;

    // Agregar al Médico B como colaborador de esta consulta
    const colabRes = await request(app)
      .post(`/api/consultas/${consultaId}/colaboradores`)
      .set('Authorization', `Bearer ${medicoAToken}`)
      .send({ medicoId: medicoBId });

    expect(colabRes.status).toBe(201);
  });

  test('Médico B (ahora colaborador) SÍ debería poder ver al paciente', async () => {
    const res = await request(app)
      .get(`/api/patients/${pacienteId}`)
      .set('Authorization', `Bearer ${medicoBToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('nombre', 'Carlos');
  });

  test('Médico B debería poder añadir una nota clínica al historial de la consulta', async () => {
    // Buscar la consulta del paciente
    const histRes = await request(app)
      .get(`/api/consultas/paciente/${pacienteId}`)
      .set('Authorization', `Bearer ${medicoBToken}`);

    expect(histRes.status).toBe(200);
    const consultaId = histRes.body[0].id;

    const notaRes = await request(app)
      .post(`/api/consultas/${consultaId}/notas`)
      .set('Authorization', `Bearer ${medicoBToken}`)
      .send({ contenido: 'Segunda opinión: Paciente en perfecto estado cardíaco.' });

    expect(notaRes.status).toBe(201);
    expect(notaRes.body).toHaveProperty('contenido', 'Segunda opinión: Paciente en perfecto estado cardíaco.');
    expect(notaRes.body.autor).toHaveProperty('id', medicoBId);
  });
});

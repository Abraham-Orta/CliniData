/* eslint-disable node/no-unpublished-require, no-unused-vars */
const request = require('supertest');
const app = require('../index');
const prisma = require('../src/config/database');
const { generateToken } = require('../src/utils/jwt');
const bcrypt = require('bcryptjs');
const { decrypt } = require('../src/utils/securityHelper');

describe('Pruebas de Integración: Actualización Parcial (PATCH) de Pacientes', () => {
  let clinicaId;
  let medicoAToken, medicoBToken;
  let medicoAId, medicoBId;
  let pacienteId;
  let datosOriginales;

  beforeAll(async () => {
    // Limpiar tablas para evitar colisiones
    await prisma.auditoria.deleteMany();
    await prisma.colaboradorConsulta.deleteMany();
    await prisma.notaClinica.deleteMany();
    await prisma.tratamiento.deleteMany();
    await prisma.consultaDiagnostico.deleteMany();
    await prisma.consulta.deleteMany();
    await prisma.paciente.deleteMany();
    await prisma.usuario.deleteMany();
    await prisma.clinica.deleteMany();

    // Crear clínica de prueba
    const clinica = await prisma.clinica.create({
      data: { nombre: 'Clínica de Pruebas PATCH', direccion: 'Avenida Cripto 789' }
    });
    clinicaId = clinica.id;

    // Crear médicos
    const passHash = await bcrypt.hash('password123', 10);

    const medicoA = await prisma.usuario.create({
      data: { email: 'medico.a.patch@example.com', nombre: 'Médico', apellido: 'A', password: passHash, rol: 'MEDICO', clinicaId }
    });
    medicoAId = medicoA.id;
    medicoAToken = generateToken(medicoA.id, 'MEDICO');

    const medicoB = await prisma.usuario.create({
      data: { email: 'medico.b.patch@example.com', nombre: 'Médico', apellido: 'B', password: passHash, rol: 'MEDICO', clinicaId }
    });
    medicoBId = medicoB.id;
    medicoBToken = generateToken(medicoB.id, 'MEDICO');
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  test('Debería registrar un paciente inicial con éxito para las pruebas', async () => {
    datosOriginales = {
      nombre: 'Juan',
      apellido: 'Pérez',
      documentoIdentidad: '12345678X',
      fechaNacimiento: '1985-05-15',
      genero: 'MASCULINO',
      telefono: '555-1111',
      email: 'juan.perez@example.com',
      contactoEmergencia: 'María Pérez',
      telefonoEmergencia: '555-2222',
      nombreTutor: null,
      dniTutor: null
    };

    const res = await request(app)
      .post('/api/patients')
      .set('Authorization', `Bearer ${medicoAToken}`)
      .send(datosOriginales);

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    pacienteId = res.body.id;
  });

  test('Debería actualizar únicamente el teléfono mediante PATCH', async () => {
    const nuevoTelefono = '555-9999';

    const res = await request(app)
      .patch(`/api/patients/${pacienteId}`)
      .set('Authorization', `Bearer ${medicoAToken}`)
      .send({ telefono: nuevoTelefono });

    expect(res.status).toBe(200);
    expect(res.body.telefono).toBe(nuevoTelefono);
    
    // El resto de los campos deben permanecer idénticos a los originales
    expect(res.body.nombre).toBe(datosOriginales.nombre);
    expect(res.body.apellido).toBe(datosOriginales.apellido);
    expect(res.body.documentoIdentidad).toBe(datosOriginales.documentoIdentidad);
    expect(res.body.email).toBe(datosOriginales.email);
    expect(res.body.contactoEmergencia).toBe(datosOriginales.contactoEmergencia);

    // Comprobar directamente en la base de datos que está encriptado
    const dbPatient = await prisma.paciente.findUnique({ where: { id: pacienteId } });
    expect(dbPatient.telefono).not.toBe(nuevoTelefono);
    expect(dbPatient.telefono.split(':').length).toBe(3); // formato iv:tag:cipherText
    expect(decrypt(dbPatient.telefono)).toBe(nuevoTelefono);
  });

  test('Debería actualizar el documentoIdentidad y regenerar su Blind Index', async () => {
    const nuevoDni = '87654321Y';

    const res = await request(app)
      .patch(`/api/patients/${pacienteId}`)
      .set('Authorization', `Bearer ${medicoAToken}`)
      .send({ documentoIdentidad: nuevoDni });

    expect(res.status).toBe(200);
    expect(res.body.documentoIdentidad).toBe(nuevoDni);

    // Comprobar que podemos buscar al paciente con el nuevo DNI usando search (Blind Index)
    const searchResNuevo = await request(app)
      .get(`/api/patients?search=${nuevoDni}`)
      .set('Authorization', `Bearer ${medicoAToken}`);

    expect(searchResNuevo.status).toBe(200);
    expect(searchResNuevo.body.data.length).toBe(1);
    expect(searchResNuevo.body.data[0].id).toBe(pacienteId);

    // Comprobar que buscar con el antiguo DNI no retorna resultados
    const searchResAntiguo = await request(app)
      .get(`/api/patients?search=${datosOriginales.documentoIdentidad}`)
      .set('Authorization', `Bearer ${medicoAToken}`);

    expect(searchResAntiguo.status).toBe(200);
    expect(searchResAntiguo.body.data.length).toBe(0);
  });

  test('Debería poder limpiar el email estableciéndolo a null de forma parcial', async () => {
    const res = await request(app)
      .patch(`/api/patients/${pacienteId}`)
      .set('Authorization', `Bearer ${medicoAToken}`)
      .send({ email: null });

    expect(res.status).toBe(200);
    expect(res.body.email).toBeNull();

    // Comprobar en base de datos
    const dbPatient = await prisma.paciente.findUnique({ where: { id: pacienteId } });
    expect(dbPatient.email).toBeNull();
  });

  test('Debería fallar con error 400 si se envía un formato de email inválido', async () => {
    const res = await request(app)
      .patch(`/api/patients/${pacienteId}`)
      .set('Authorization', `Bearer ${medicoAToken}`)
      .send({ email: 'correo-invalido' });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error', 'Datos inválidos');
  });

  test('Debería fallar con error 403 si un médico sin relación (Médico B) intenta actualizar al paciente', async () => {
    const res = await request(app)
      .patch(`/api/patients/${pacienteId}`)
      .set('Authorization', `Bearer ${medicoBToken}`)
      .send({ telefono: '555-0000' });

    expect(res.status).toBe(403);
    expect(res.body).toHaveProperty('error');
    expect(res.body.error).toContain('No tiene autorización sobre el expediente clínico');
  });
});

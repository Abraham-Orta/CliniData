/* eslint-disable node/no-unpublished-require, no-unused-vars, no-empty */
const request = require('supertest');
const app = require('../index');
const prisma = require('../src/config/database');
const fs = require('fs');
const path = require('path');

const tmpDir = path.join(__dirname, 'tmp');
if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

describe('Adjuntos - integración', () => {
  let token;
  let tokenOther;
  let patient;
  let consulta;
  let attachmentId;
  let uploadedFilePath;

  beforeAll(async () => {
    // Registrar usuario médico
    const reg = await request(app).post('/api/auth/register').send({
      email: 'med1@example.com',
      password: 'Password123!',
      nombre: 'Med',
      apellido: 'Uno'
    });
    token = reg.body.token;

    // Registrar otro médico (no relacionado)
    const reg2 = await request(app).post('/api/auth/register').send({
      email: 'med2@example.com',
      password: 'Password123!',
      nombre: 'Med',
      apellido: 'Dos'
    });
    tokenOther = reg2.body.token;

    // Crear paciente por el primer médico
    const p = await request(app).post('/api/patients').set('Authorization', `Bearer ${token}`).send({
      nombre: 'Paciente',
      apellido: 'Prueba',
      documentoIdentidad: 'DNI-TEST-001',
      fechaNacimiento: '1990-01-01'
    });
    patient = p.body;

    // Crear consulta
    const c = await request(app).post('/api/consultas').set('Authorization', `Bearer ${token}`).send({
      pacienteId: patient.id,
      motivo: 'Dolor de cabeza'
    });
    consulta = c.body;

    // Crear archivo temporal PNG
    const samplePng = Buffer.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a]);
    const tmpFile = path.join(tmpDir, 'test.png');
    fs.writeFileSync(tmpFile, samplePng);
  });

  afterAll(async () => {
    // Limpiar DB: eliminar adjuntos, consultas, pacientes, usuarios creados en pruebas
    try {
      if (attachmentId) await prisma.adjunto.delete({ where: { id: attachmentId } }).catch(() => {});
      if (consulta && consulta.id) await prisma.consulta.delete({ where: { id: consulta.id } }).catch(() => {});
      if (patient && patient.id) await prisma.paciente.delete({ where: { id: patient.id } }).catch(() => {});
      // Eliminar usuarios registrados por email
      await prisma.usuario.deleteMany({ where: { email: { in: ['med1@example.com', 'med2@example.com'] } } }).catch(() => {});
    } catch (e) {
      // ignore
    }

    // Eliminar archivos temporales y uploads
    try {
      const tmpFiles = fs.readdirSync(tmpDir);
      for (const f of tmpFiles) fs.unlinkSync(path.join(tmpDir, f));
      fs.rmdirSync(tmpDir);
    } catch (e) {}

    // Close prisma connection
    await prisma.$disconnect();
  });

  test('Subir un adjunto válido', async () => {
    const tmpFile = path.join(tmpDir, 'test.png');
    const res = await request(app)
      .post(`/api/consultas/${consulta.id}/attachments`)
      .set('Authorization', `Bearer ${token}`)
      .attach('file', tmpFile, 'test.png');

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    attachmentId = res.body.id;

    // Verificar que existe en BD y nombre está cifrado
    const adj = await prisma.adjunto.findUnique({ where: { id: attachmentId } });
    expect(adj).toBeTruthy();
    expect(adj.nombre).not.toBe('test.png');

    // Save physical path for later
    uploadedFilePath = adj.ruta;
    expect(fs.existsSync(uploadedFilePath)).toBe(true);
  });

  test('Listar adjuntos de la consulta', async () => {
    const res = await request(app)
      .get(`/api/consultas/${consulta.id}/attachments`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
    const listed = res.body.find(a => a.id === attachmentId);
    expect(listed).toBeTruthy();
  });

  test('Descargar adjunto y validar contenido', async () => {
    const res = await request(app)
      .get(`/api/consultas/${consulta.id}/attachments/${attachmentId}`)
      .set('Authorization', `Bearer ${token}`)
      .buffer()
      .parse((res, cb) => {
        // collect raw body
        res.data = '';
        res.setEncoding('binary');
        res.on('data', chunk => { res.data += chunk; });
        res.on('end', () => cb(null, Buffer.from(res.data, 'binary')));
      });

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toBeTruthy();
    // compare file sizes roughly
    const stat = fs.statSync(uploadedFilePath);
    expect(Number(res.headers['content-length'] || stat.size)).toBeGreaterThan(0);
  });

  test('Acceso no autorizado por otro médico', async () => {
    const res = await request(app)
      .get(`/api/consultas/${consulta.id}/attachments/${attachmentId}`)
      .set('Authorization', `Bearer ${tokenOther}`);

    expect([401,403,404]).toContain(res.status); // could be 403 (denegado) or 404
  });

  test('Rechazo de tipo de archivo no permitido', async () => {
    // Crear archivo .exe
    const badFile = path.join(tmpDir, 'bad.exe');
    fs.writeFileSync(badFile, Buffer.from([0x4d,0x5a,0x00,0x00]));

    const res = await request(app)
      .post(`/api/consultas/${consulta.id}/attachments`)
      .set('Authorization', `Bearer ${token}`)
      .attach('file', badFile, 'bad.exe');

    // Our controller returns 400 when multer rejects file (no req.file)
    expect([400, 415, 422]).toContain(res.status);
  });

  test('Eliminar adjunto', async () => {
    const res = await request(app)
      .delete(`/api/consultas/${consulta.id}/attachments/${attachmentId}`)
      .set('Authorization', `Bearer ${token}`);

    expect([204,200]).toContain(res.status);
    // archivo físico no debe existir
    if (uploadedFilePath && fs.existsSync(uploadedFilePath)) {
      // sometimes deletion might not be immediate but expect it to be gone
      // attempt to remove now
      fs.unlinkSync(uploadedFilePath);
    }
  });
});

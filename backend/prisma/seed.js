/* eslint-disable no-process-exit */
const prisma = require('../src/config/database');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function main() {
  console.log('Sembrando base de datos...');

  // 1. Crear o buscar la Clínica principal
  let clinica = await prisma.clinica.findFirst();
  if (!clinica) {
    clinica = await prisma.clinica.create({
      data: {
        nombre: 'Clínica de Salud Familiar Local',
        direccion: 'Av. Principal 123, Centro',
        telefono: '555-0199'
      }
    });
    console.log('Seed: Clínica creada ->', clinica.nombre);
  } else {
    console.log('Seed: Clínica existente ->', clinica.nombre);
  }

  // 2. Crear Administrador por defecto
  const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@example.com';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'password123';

  let admin = await prisma.usuario.findUnique({ where: { email: adminEmail } });
  if (!admin) {
    const hashed = await bcrypt.hash(adminPassword, 10);
    admin = await prisma.usuario.create({
      data: {
        email: adminEmail,
        nombre: 'Admin',
        apellido: 'CliniData',
        password: hashed,
        rol: 'ADMIN',
        activo: true,
        clinicaId: clinica.id
      }
    });
    console.log('Seed: Administrador creado ->', adminEmail);
  } else {
    console.log('Seed: Administrador existente');
  }

  // 3. Crear Médicos de prueba
  const medAPass = 'password123';
  const medBPass = 'password123';

  let medicoA = await prisma.usuario.findUnique({ where: { email: 'medico.a@example.com' } });
  if (!medicoA) {
    const hashed = await bcrypt.hash(medAPass, 10);
    medicoA = await prisma.usuario.create({
      data: {
        email: 'medico.a@example.com',
        nombre: 'Carlos',
        apellido: 'Mendoza',
        password: hashed,
        rol: 'MEDICO',
        activo: true,
        clinicaId: clinica.id
      }
    });
    console.log('Seed: Médico A creado -> medico.a@example.com');
  }

  let medicoB = await prisma.usuario.findUnique({ where: { email: 'medico.b@example.com' } });
  if (!medicoB) {
    const hashed = await bcrypt.hash(medBPass, 10);
    medicoB = await prisma.usuario.create({
      data: {
        email: 'medico.b@example.com',
        nombre: 'Elena',
        apellido: 'Ríos',
        password: hashed,
        rol: 'MEDICO',
        activo: true,
        clinicaId: clinica.id
      }
    });
    console.log('Seed: Médico B creado -> medico.b@example.com');
  }

  // 4. Crear Diagnósticos estándar (CIE-10)
  const diagnosticosData = [
    { codigo: 'I10', descripcion: 'Hipertensión esencial (primaria)' },
    { codigo: 'E11', descripcion: 'Diabetes mellitus no insulinodependiente' },
    { codigo: 'J06', descripcion: 'Infecciones agudas de las vías respiratorias superiores' }
  ];

  for (const diag of diagnosticosData) {
    const existing = await prisma.diagnostico.findUnique({ where: { codigo: diag.codigo } });
    if (!existing) {
      await prisma.diagnostico.create({ data: diag });
      console.log(`Seed: Diagnóstico ${diag.codigo} creado.`);
    }
  }

  // 5. Crear Paciente de prueba asignado al Médico A (Carlos)
  // Nota: Al usar securePrisma, 'nombre', 'apellido', 'documentoIdentidad', etc. se guardan cifrados
  let paciente1 = await prisma.paciente.findFirst({
    where: {
      documentoIdentidadHash: prisma.$extends ? undefined : 'dummy' // Buscamos por hash
    }
  });

  // Buscaremos usando el hash exacto para evitar crear duplicados del paciente de prueba
  const dniHash = require('../src/utils/securityHelper').generateBlindIndex('12345678A');
  paciente1 = await prisma.paciente.findUnique({ where: { documentoIdentidadHash: dniHash } }).catch(() => null);

  if (!paciente1) {
    paciente1 = await prisma.paciente.create({
      data: {
        nombre: 'Juan',
        apellido: 'Pérez',
        fechaNacimiento: new Date('1985-05-15'),
        genero: 'MASCULINO',
        documentoIdentidad: '12345678A',
        telefono: '555-0011',
        email: 'juan.perez@example.com',
        clinicaId: clinica.id,
        medicoPrincipalId: medicoA.id
      }
    });
    console.log('Seed: Paciente de prueba creado (Juan Pérez) asignado al Médico A');

    // 6. Crear consulta inicial para el paciente
    const diagnosticoI10 = await prisma.diagnostico.findUnique({ where: { codigo: 'I10' } });
    
    await prisma.consulta.create({
      data: {
        motivo: 'Control de presión arterial',
        sintomas: 'Dolor de cabeza leve ocasional',
        presionArterial: '140/90',
        temperatura: 36.5,
        frecuenciaCardiaca: 80,
        peso: 78.5,
        observaciones: 'Paciente presenta ligera elevación de presión arterial.',
        pacienteId: paciente1.id,
        medicoId: medicoA.id,
        diagnosticos: {
          create: {
            diagnosticoId: diagnosticoI10.id
          }
        },
        tratamientos: {
          create: {
            medicamento: 'Enalapril',
            dosis: '10mg',
            frecuencia: 'Cada 24 horas',
            duracion: '30 días',
            indicaciones: 'Tomar por la mañana en ayunas'
          }
        }
      }
    });
    console.log('Seed: Consulta de prueba creada para Juan Pérez');
  }

  console.log('Sembrado finalizado con éxito.');
}

main()
  .catch((e) => {
    console.error('Error durante el sembrado:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

/* eslint-disable no-process-exit */
const prisma = require('../src/config/database');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const { generateBlindIndex } = require('../src/utils/securityHelper');

// Datos de ejemplo para nombres, apellidos, etc.
const nombres = ['Juan', 'María', 'Carlos', 'Elena', 'Roberto', 'Ana', 'Diego', 'Sofía', 'Luis', 'Carmen'];
const apellidos = ['Pérez', 'García', 'Martínez', 'López', 'Hernández', 'González', 'Sánchez', 'Jiménez', 'Rodríguez', 'Morales'];
const motivosConsulta = [
  'Control de presión arterial',
  'Revisión general',
  'Dolor de cabeza',
  'Síntomas de gripe',
  'Control de diabetes',
  'Dolor en el pecho',
  'Fatiga extrema',
  'Problemas digestivos',
  'Infección respiratoria',
  'Seguimiento post-operatorio'
];
const medicamentos = [
  'Enalapril', 'Metformina', 'Amoxicilina', 'Ibuprofeno', 'Paracetamol',
  'Lisinopril', 'Atorvastatina', 'Losartán', 'Amlodipina', 'Aspirina'
];

function getRandomElement(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateDNI() {
  return Math.floor(10000000 + Math.random() * 90000000).toString();
}

function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

async function main() {
  console.log('🌱 Iniciando siembra de base de datos con datos de ejemplo...\n');

  // 1. Crear 3 clínicas
  console.log('📋 Creando clínicas...');
  const clinicasData = [
    { nombre: 'Clínica de Salud Familiar Local', direccion: 'Av. Principal 123, Centro', telefono: '555-0199' },
    { nombre: 'Hospital Regional del Este', direccion: 'Calle 15 #456, Zona Este', telefono: '555-0200' },
    { nombre: 'Centro Médico Privado', direccion: 'Av. Libertad 789, Zona Comercial', telefono: '555-0300' }
  ];

  const clinicas = [];
  for (const clinicaData of clinicasData) {
    let clinica = await prisma.clinica.findFirst({ where: { nombre: clinicaData.nombre } });
    if (!clinica) {
      clinica = await prisma.clinica.create({ data: clinicaData });
      console.log(`  ✓ ${clinica.nombre}`);
    }
    clinicas.push(clinica);
  }

  // 2. Crear usuarios (admins y médicos) para cada clínica
  console.log('\n👥 Creando usuarios...');
  const usuarios = {};
  let userCount = 0;

  for (const clinica of clinicas) {
    // Crear 1 admin por clínica
    const adminEmail = `admin${clinicas.indexOf(clinica)}@example.com`;
    let admin = await prisma.usuario.findUnique({ where: { email: adminEmail } }).catch(() => null);
    if (!admin) {
      const hashed = await bcrypt.hash('password123', 10);
      admin = await prisma.usuario.create({
        data: {
          email: adminEmail,
          nombre: 'Admin',
          apellido: clinica.nombre,
          password: hashed,
          rol: 'ADMIN',
          activo: true,
          clinicaId: clinica.id
        }
      });
      userCount++;
      console.log(`  ✓ Admin: ${admin.email}`);
    }
    usuarios[adminEmail] = admin;

    // Crear 5-7 médicos por clínica
    const medCount = 5 + Math.floor(Math.random() * 3);
    for (let i = 0; i < medCount; i++) {
      const nombre = getRandomElement(nombres);
      const apellido = getRandomElement(apellidos);
      const email = `medico.${nombre.toLowerCase()}.${apellido.toLowerCase()}${i}@example.com`;

      let medico = await prisma.usuario.findUnique({ where: { email } }).catch(() => null);
      if (!medico) {
        const hashed = await bcrypt.hash('password123', 10);
        medico = await prisma.usuario.create({
          data: {
            email,
            nombre,
            apellido,
            password: hashed,
            rol: 'MEDICO',
            activo: Math.random() > 0.1,
            clinicaId: clinica.id
          }
        });
        userCount++;
        console.log(`  ✓ Médico: ${medico.email}`);
      }
      usuarios[email] = medico;
    }
  }

  // 3. Crear diagnósticos ampliados (CIE-10)
  console.log('\n📊 Creando diagnósticos...');
  const diagnosticosData = [
    { codigo: 'I10', descripcion: 'Hipertensión esencial (primaria)' },
    { codigo: 'I11', descripcion: 'Enfermedad cardiaca hipertensiva' },
    { codigo: 'E11', descripcion: 'Diabetes mellitus no insulinodependiente' },
    { codigo: 'E10', descripcion: 'Diabetes mellitus tipo 1' },
    { codigo: 'J06', descripcion: 'Infecciones agudas de las vías respiratorias superiores' },
    { codigo: 'J18', descripcion: 'Neumonía sin especificar' },
    { codigo: 'K21', descripcion: 'Reflujo gastroesofágico' },
    { codigo: 'M79.3', descripcion: 'Paniculitis no especificada' },
    { codigo: 'F41', descripcion: 'Trastornos de ansiedad' },
    { codigo: 'M25.5', descripcion: 'Dolor articular' }
  ];

  const diagnosticos = {};
  for (const diag of diagnosticosData) {
    let existing = await prisma.diagnostico.findUnique({ where: { codigo: diag.codigo } }).catch(() => null);
    if (!existing) {
      existing = await prisma.diagnostico.create({ data: diag });
      console.log(`  ✓ ${diag.codigo} - ${diag.descripcion}`);
    }
    diagnosticos[diag.codigo] = existing;
  }

  // 4. Crear pacientes abundantes
  console.log('\n🏥 Creando pacientes...');
  let patientCount = 0;
  const pacientesPorClinica = 15;

  for (const clinica of clinicas) {
    const medicosClinica = Object.values(usuarios).filter(u => u.clinicaId === clinica.id && u.rol === 'MEDICO');

    for (let i = 0; i < pacientesPorClinica; i++) {
      const nombre = getRandomElement(nombres);
      const apellido = getRandomElement(apellidos);
      const dni = generateDNI();
      const dniHash = generateBlindIndex(dni);

      let paciente = await prisma.paciente.findUnique({ where: { documentoIdentidadHash: dniHash } }).catch(() => null);
      if (!paciente) {
        const medicoPrincipal = getRandomElement(medicosClinica);
        paciente = await prisma.paciente.create({
          data: {
            nombre,
            apellido,
            fechaNacimiento: randomDate(new Date(1950, 0, 1), new Date(2010, 0, 1)),
            genero: ['MASCULINO', 'FEMENINO', 'OTRO'][Math.floor(Math.random() * 3)],
            documentoIdentidad: dni,
            documentoIdentidadHash: dniHash,
            telefono: `555-${Math.floor(1000 + Math.random() * 9000)}`,
            email: `${nombre.toLowerCase()}.${apellido.toLowerCase()}@example.com`,
            clinicaId: clinica.id,
            medicoPrincipalId: medicoPrincipal.id
          }
        });
        patientCount++;
        if (i < 2) console.log(`  ✓ ${nombre} ${apellido} en ${clinica.nombre}`);
      }

      // 5. Crear múltiples consultas por paciente (3-8 consultas)
      const consultasCount = 3 + Math.floor(Math.random() * 6);
      for (let c = 0; c < consultasCount; c++) {
        const medico = getRandomElement(medicosClinica);
        const motivo = getRandomElement(motivosConsulta);
        const diagnosticoCodigos = Object.keys(diagnosticos).slice(0, Math.floor(Math.random() * 3) + 1);

        const consulta = await prisma.consulta.create({
          data: {
            fecha: randomDate(new Date(2023, 0, 1), new Date()),
            motivo,
            sintomas: ['Síntomas leves', 'Síntomas moderados', 'Sin síntomas aparentes'][Math.floor(Math.random() * 3)],
            presionArterial: `${120 + Math.floor(Math.random() * 40)}/${80 + Math.floor(Math.random() * 20)}`,
            temperatura: 36 + Math.random() * 1.5,
            frecuenciaCardiaca: 60 + Math.floor(Math.random() * 40),
            peso: 50 + Math.random() * 50,
            observaciones: 'Paciente en buen estado general. Seguimiento recomendado.',
            pacienteId: paciente.id,
            medicoId: medico.id,
            diagnosticos: {
              create: diagnosticoCodigos.map(codigo => ({
                diagnosticoId: diagnosticos[codigo].id
              }))
            },
            tratamientos: {
              create: Array.from({ length: 1 + Math.floor(Math.random() * 2) }, () => ({
                medicamento: getRandomElement(medicamentos),
                dosis: ['10mg', '20mg', '500mg', '100mg', '250mg'][Math.floor(Math.random() * 5)],
                frecuencia: ['Cada 8 horas', 'Cada 12 horas', 'Cada 24 horas', 'Dos veces al día'][Math.floor(Math.random() * 4)],
                duracion: ['7 días', '14 días', '30 días', '90 días'][Math.floor(Math.random() * 4)],
                indicaciones: 'Seguir indicaciones médicas. Consultar ante efectos secundarios.'
              }))
            }
          }
        });

        // Crear notas clínicas ocasionales
        if (Math.random() > 0.5) {
          await prisma.notaClinica.create({
            data: {
              contenido: 'Revisión clínica completada. Paciente responde bien al tratamiento.',
              consultaId: consulta.id,
              autorId: medico.id
            }
          });
        }

        // Agregar colaboradores ocasionalmente
        if (Math.random() > 0.7 && medicosClinica.length > 1) {
          const colaborador = getRandomElement(medicosClinica.filter(m => m.id !== medico.id));
          await prisma.colaboradorConsulta.create({
            data: {
              consultaId: consulta.id,
              medicoId: colaborador.id
            }
          }).catch(() => {}); // Ignorar errores de unicidad
        }
      }
    }
  }

  // 6. Crear citas programadas (usando raw SQL por problemas de permisos de node_modules)
  console.log('\n📅 Creando citas...');
  let citasCount = 0;
  for (const clinica of clinicas) {
    const medicosClinica = Object.values(usuarios).filter(u => u.clinicaId === clinica.id && u.rol === 'MEDICO');
    const pacientesClinica = await prisma.paciente.findMany({ where: { clinicaId: clinica.id }, take: 10 });

    for (const paciente of pacientesClinica) {
      const citasP = 1 + Math.floor(Math.random() * 3);
      for (let i = 0; i < citasP; i++) {
        const medico = getRandomElement(medicosClinica);
        const fechaHora = randomDate(new Date(), new Date(new Date().getFullYear(), 11, 31));
        const id = require('crypto').randomUUID();
        const tipo = ['consulta', 'control', 'teleconsulta'][Math.floor(Math.random() * 3)];
        const estado = ['pendiente', 'confirmada', 'cancelada', 'completada'][Math.floor(Math.random() * 4)];
        const duracion = 30 + Math.floor(Math.random() * 30);

        try {
          await prisma.$executeRaw`
            INSERT INTO Cita (id, pacienteId, medicoId, fechaHora, duracion, tipo, estado, notas, creadoEn)
            VALUES (${id}, ${paciente.id}, ${medico.id}, ${fechaHora}, ${duracion}, ${tipo}, ${estado}, 'Cita programada. Se requiere confirmación.', ${new Date()})
          `;
          citasCount++;
        } catch (e) {
          console.error(`  Error creando cita: ${e.message}`);
        }
      }
    }
  }

  console.log(`\n✅ Siembra completada con éxito!`);
  console.log(`📊 Resumen:`);
  console.log(`   • Clínicas: ${clinicas.length}`);
  console.log(`   • Usuarios: ${userCount}`);
  console.log(`   • Pacientes: ${patientCount}`);
  console.log(`   • Diagnósticos: ${Object.keys(diagnosticos).length}`);
  console.log(`   • Consultas: ~${patientCount * 5} (3-8 por paciente)`);
  console.log(`   • Citas: ${citasCount}`);
  console.log(`\n💾 Base de datos completamente poblada con datos de ejemplo!`);
}

main()
  .catch((e) => {
    console.error('❌ Error durante el sembrado:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

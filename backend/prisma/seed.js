/* eslint-disable no-process-exit */
const prisma = require('../src/config/database');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const { generateBlindIndex } = require('../src/utils/securityHelper');

const nombres = ['Juan', 'María', 'Carlos', 'Elena', 'Roberto', 'Ana', 'Diego', 'Sofía', 'Luis', 'Carmen', 'Javier', 'Laura', 'Pedro', 'Marta', 'Andrés', 'Isabel', 'Miguel', 'Lucía', 'Fernando', 'Paula'];
const apellidos = ['Pérez', 'García', 'Martínez', 'López', 'Hernández', 'González', 'Sánchez', 'Jiménez', 'Rodríguez', 'Morales', 'Gómez', 'Fernández', 'Díaz', 'Álvarez', 'Romero', 'Ruiz', 'Navarro', 'Torres', 'Domínguez', 'Vázquez'];

const motivosConsulta = [
  'Control anual de salud',
  'Seguimiento de hipertensión arterial',
  'Control glucémico en diabetes',
  'Cefalea tensional recurrente',
  'Dolor lumbar crónico',
  'Infección de vías respiratorias',
  'Evaluación cardiovascular',
  'Dermatitis atópica severa',
  'Trastorno del sueño',
  'Síndrome metabólico',
  'Revisión post-operatoria',
  'Cuadro febril agudo',
  'Dolor articular - posible artritis',
  'Chequeo general preventivo',
  'Asma bronquial en exacerbación'
];

const observaciones = [
  'Paciente refiere mejoría clínica. Se ajusta dosis de medicación. Próximo control en 3 meses.',
  'Cuadro estable. Se indican laboratorios de rutina y ecografía de control.',
  'Paciente con mala adherencia al tratamiento. Se refuerzan pautas dietéticas y de ejercicio.',
  'Presenta leve dolor residual. Evolución favorable. Alta médica en 2 semanas.',
  'Se detecta presión arterial elevada. Se inicia tratamiento farmacológico.',
  'Interconsulta solicitada con especialista. Continuar tratamiento actual hasta evaluación.',
  'Resultados de laboratorio dentro de límites normales. Excelente estado de salud.',
  'Paciente manifiesta efectos secundarios leves al medicamento. Se cambia prescripción.'
];

const medicamentos = [
  'Enalapril 20mg', 'Metformina 850mg', 'Amoxicilina 500mg', 'Ibuprofeno 400mg', 'Paracetamol 1g',
  'Lisinopril 10mg', 'Atorvastatina 40mg', 'Losartán 50mg', 'Amlodipina 5mg', 'Aspirina 100mg',
  'Omeprazol 20mg', 'Salbutamol inhalador', 'Levotiroxina 100mcg', 'Clonazepam 2mg', 'Sertralina 50mg'
];

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
  { codigo: 'M25.5', descripcion: 'Dolor articular' },
  { codigo: 'J45', descripcion: 'Asma' },
  { codigo: 'E66', descripcion: 'Obesidad' },
  { codigo: 'G44', descripcion: 'Otros síndromes de cefalea' },
  { codigo: 'M54.5', descripcion: 'Lumbago no especificado' }
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

async function cleanDatabase() {
  console.log('🧹 Limpiando la base de datos...');
  await prisma.listaEspera.deleteMany();
  await prisma.cita.deleteMany();
  await prisma.adjunto.deleteMany();
  await prisma.auditoria.deleteMany();
  await prisma.colaboradorConsulta.deleteMany();
  await prisma.notaClinica.deleteMany();
  await prisma.tratamiento.deleteMany();
  await prisma.consultaDiagnostico.deleteMany();
  await prisma.consulta.deleteMany();
  await prisma.paciente.deleteMany();
  await prisma.diagnostico.deleteMany();
  await prisma.usuario.deleteMany();
  await prisma.clinica.deleteMany();
  console.log('✓ Base de datos limpia.\n');
}

async function main() {
  console.log('🌱 Iniciando siembra de datos realistas para demostración...\n');
  await cleanDatabase();

  const clinicasData = [
    { nombre: 'Clínica de Especialidades Las Condes', direccion: 'Av. Las Condes 1234', telefono: '555-1010' },
    { nombre: 'Centro Médico Integral Providencia', direccion: 'Av. Providencia 456', telefono: '555-2020' }
  ];

  const clinicas = [];
  for (const clinicaData of clinicasData) {
    const clinica = await prisma.clinica.create({ data: clinicaData });
    clinicas.push(clinica);
  }
  console.log(`📋 Creadas ${clinicas.length} clínicas.`);

  console.log('👥 Creando usuarios médicos y administradores...');
  const hashed = await bcrypt.hash('password123', 10);
  const medicos = [];

  // Usuario Demo principal
  const clinicaPrincipal = clinicas[0];
  const demoMedico = await prisma.usuario.create({
    data: {
      email: 'medico@clinidata.com',
      password: hashed,
      nombre: 'Carlos',
      apellido: 'Mendoza',
      rol: 'MEDICO',
      activo: true,
      clinicaId: clinicaPrincipal.id
    }
  });
  medicos.push(demoMedico);
  console.log('  ✓ Creado Usuario Demo: medico@clinidata.com (Pass: password123)');

  const demoAdmin = await prisma.usuario.create({
    data: {
      email: 'admin@clinidata.com',
      password: hashed,
      nombre: 'Administrador',
      apellido: 'Clínica',
      rol: 'ADMIN',
      activo: true,
      clinicaId: clinicaPrincipal.id
    }
  });
  console.log('  ✓ Creado Admin Demo: admin@clinidata.com (Pass: password123)');

  // Más médicos para llenar el directorio (colegas)
  for (let i = 0; i < 8; i++) {
    const n = getRandomElement(nombres);
    const a = getRandomElement(apellidos);
    const m = await prisma.usuario.create({
      data: {
        email: `dr.${n.toLowerCase()}.${a.toLowerCase()}${i}@clinidata.com`,
        password: hashed,
        nombre: `Dr. ${n}`,
        apellido: a,
        rol: 'MEDICO',
        activo: true,
        clinicaId: clinicaPrincipal.id
      }
    });
    medicos.push(m);
  }

  console.log('📊 Creando catálogo de diagnósticos (CIE-10)...');
  const dbDiagnosticos = [];
  for (const diag of diagnosticosData) {
    const d = await prisma.diagnostico.create({ data: diag });
    dbDiagnosticos.push(d);
  }

  console.log('🏥 Creando pacientes (volumen alto)...');
  const pacientes = [];
  // Crear unos 80 pacientes para el médico demo y otros médicos
  for (let i = 0; i < 80; i++) {
    const nombre = getRandomElement(nombres);
    const apellido = getRandomElement(apellidos);
    const dni = generateDNI();
    const dniHash = generateBlindIndex(dni);
    const medicoPrincipal = i < 40 ? demoMedico : getRandomElement(medicos); // 40 pacientes para el demoMedico

    const p = await prisma.paciente.create({
      data: {
        nombre,
        apellido,
        fechaNacimiento: randomDate(new Date(1940, 0, 1), new Date(2015, 0, 1)),
        genero: ['MASCULINO', 'FEMENINO'][Math.floor(Math.random() * 2)],
        documentoIdentidad: dni,
        documentoIdentidadHash: dniHash,
        telefono: `+56 9 ${Math.floor(10000000 + Math.random() * 90000000)}`,
        email: `${nombre.toLowerCase()}.${apellido.toLowerCase()}${Math.floor(Math.random()*100)}@gmail.com`,
        clinicaId: clinicaPrincipal.id,
        medicoPrincipalId: medicoPrincipal.id
      }
    });
    pacientes.push(p);
  }
  console.log(`  ✓ Creados ${pacientes.length} pacientes.`);

  console.log('📝 Creando historial de consultas y tratamientos...');
  let totalConsultas = 0;
  for (const paciente of pacientes) {
    const numConsultas = 1 + Math.floor(Math.random() * 5); // 1 a 5 consultas por paciente
    for (let c = 0; c < numConsultas; c++) {
      const diag1 = getRandomElement(dbDiagnosticos);
      const diag2 = Math.random() > 0.7 ? getRandomElement(dbDiagnosticos) : null;
      
      const consulta = await prisma.consulta.create({
        data: {
          fecha: randomDate(new Date(2023, 0, 1), new Date()),
          motivo: getRandomElement(motivosConsulta),
          sintomas: 'Paciente refiere malestar general, astenia y adinamia. Sin otros síntomas de alarma.',
          presionArterial: `${110 + Math.floor(Math.random() * 40)}/${70 + Math.floor(Math.random() * 25)}`,
          temperatura: 36 + (Math.random() * 2),
          frecuenciaCardiaca: 60 + Math.floor(Math.random() * 40),
          peso: 50 + Math.floor(Math.random() * 60),
          observaciones: getRandomElement(observaciones),
          pacienteId: paciente.id,
          medicoId: paciente.medicoPrincipalId,
          tratamientos: {
            create: [
              {
                medicamento: getRandomElement(medicamentos),
                dosis: '1 comprimido',
                frecuencia: 'Cada 12 horas',
                duracion: '14 días',
                indicaciones: 'Tomar con abundante agua después de las comidas.'
              }
            ]
          }
        }
      });

      // Relación con diagnósticos
      await prisma.consultaDiagnostico.create({
        data: { consultaId: consulta.id, diagnosticoId: diag1.id }
      });
      if (diag2 && diag1.id !== diag2.id) {
        await prisma.consultaDiagnostico.create({
          data: { consultaId: consulta.id, diagnosticoId: diag2.id }
        });
      }

      totalConsultas++;
    }
  }
  console.log(`  ✓ Creadas ${totalConsultas} consultas clínicas con diagnósticos y tratamientos.`);

  console.log('📅 Generando Citas para la Agenda...');
  let citasCount = 0;
  const hoy = new Date();
  hoy.setHours(9, 0, 0, 0); // Empezar a las 9 AM
  
  // Citas para la semana actual
  for (let i = -2; i <= 5; i++) { // Días desde hace 2 días hasta 5 en el futuro
    for (let h = 9; h <= 17; h++) { // Horarios de 9 a 17 hrs
      if (Math.random() > 0.6) continue; // No todas las horas ocupadas
      
      const paciente = getRandomElement(pacientes);
      const fechaHora = new Date(hoy);
      fechaHora.setDate(hoy.getDate() + i);
      fechaHora.setHours(h, [0, 30][Math.floor(Math.random()*2)], 0, 0);
      
      let estado = 'pendiente';
      if (i < 0) estado = 'completada';
      if (i === 0 && Math.random() > 0.8) estado = 'cancelada';

      await prisma.cita.create({
        data: {
          pacienteId: paciente.id,
          medicoId: demoMedico.id, // Mayormente citas para el demo medico
          fechaHora: fechaHora,
          duracion: 30,
          tipo: ['Consulta General', 'Control', 'Lectura Exámenes'][Math.floor(Math.random() * 3)],
          estado: estado,
          notas: 'Paciente reservó vía portal web.'
        }
      });
      citasCount++;
    }
  }
  console.log(`  ✓ Creadas ${citasCount} citas en la agenda.`);

  console.log('⏳ Generando Lista de Espera (Waitlist)...');
  // Pacientes en lista de espera de hoy
  const waitlistCount = 5;
  for (let i = 0; i < waitlistCount; i++) {
    const paciente = getRandomElement(pacientes);
    await prisma.listaEspera.create({
      data: {
        pacienteId: paciente.id,
        medicoId: demoMedico.id,
        urgencia: ['alta', 'media', 'baja'][Math.floor(Math.random() * 3)],
        tipoRequerido: ['Urgencia menor', 'Sobre cupo', 'Control Post-Cirugía'][Math.floor(Math.random() * 3)],
        notas: 'Disponibilidad flexible. Llamar al móvil si se libera cupo.',
        estado: 'esperando'
      }
    });
  }
  console.log(`  ✓ Creados ${waitlistCount} pacientes en lista de espera.`);

  console.log('\n🚀 ¡SEMBRADO DE DATOS EXITOSO PARA DEMO!');
  console.log('Resumen:');
  console.log(`- ${pacientes.length} Pacientes en la base de datos.`);
  console.log(`- ${totalConsultas} Consultas en el historial.`);
  console.log(`- ${citasCount} Citas en la Agenda (semana actual).`);
  console.log(`- ${waitlistCount} Pacientes en la Lista de Espera.`);
}

main()
  .catch((e) => {
    console.error('❌ Error durante el sembrado:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

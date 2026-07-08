const { PrismaClient } = require('../src/generated/client');
const bcrypt = require('bcryptjs');
const { fakerES: faker } = require('@faker-js/faker');
const { encrypt, generateBlindIndex } = require('../src/utils/securityHelper');

const prisma = new PrismaClient();

async function clearDB() {
  console.log('Clearing existing data...');
  await prisma.listaEspera.deleteMany();
  await prisma.cita.deleteMany();
  await prisma.adjunto.deleteMany();
  await prisma.auditoria.deleteMany();
  await prisma.colaboradorConsulta.deleteMany();
  await prisma.notaClinica.deleteMany();
  await prisma.tratamiento.deleteMany();
  await prisma.consultaDiagnostico.deleteMany();
  await prisma.diagnostico.deleteMany();
  await prisma.consulta.deleteMany();
  await prisma.paciente.deleteMany();
  await prisma.usuario.deleteMany();
  await prisma.clinica.deleteMany();
}

async function main() {
  await clearDB();
  const passwordHash = await bcrypt.hash('password123', 10);

  // 1. Crear Clínica
  console.log('Creating clinic...');
  const clinica = await prisma.clinica.create({
    data: {
      nombre: 'Centro Clínico Integral Caracas',
      direccion: 'Av. Libertador con Calle El Bosque, Caracas',
      telefono: '0212-555-0100'
    }
  });

  // 2. Crear Usuarios (1 Admin, 4 Médicos, 3 Enfermeros)
  console.log('Creating users...');
  const admin = await prisma.usuario.create({
    data: {
      email: 'admin@clinidata.com', password: passwordHash, nombre: 'Admin', apellido: 'Sistema', rol: 'ADMIN', clinicaId: clinica.id
    }
  });

  const doctores = [];
  const especialidades = ['Cardiología', 'Pediatría', 'Medicina General', 'Ginecología'];
  for (let i = 0; i < 4; i++) {
    const doc = await prisma.usuario.create({
      data: {
        email: `medico${i+1}@clinidata.com`, password: passwordHash, nombre: faker.person.firstName(), apellido: faker.person.lastName(), rol: 'MEDICO', clinicaId: clinica.id
      }
    });
    doctores.push(doc);
  }

  const enfermeros = [];
  for (let i = 0; i < 3; i++) {
    const enf = await prisma.usuario.create({
      data: {
        email: `enfermera${i+1}@clinidata.com`, password: passwordHash, nombre: faker.person.firstName(), apellido: faker.person.lastName(), rol: 'ENFERMERO', clinicaId: clinica.id
      }
    });
    enfermeros.push(enf);
  }

  // 3. Crear Diagnósticos (diccionario común)
  console.log('Creating diagnoses...');
  const dxList = [
    { codigo: 'I10', descripcion: 'Hipertensión esencial' },
    { codigo: 'E11', descripcion: 'Diabetes mellitus tipo 2' },
    { codigo: 'J00', descripcion: 'Rinofaringitis aguda (resfriado común)' },
    { codigo: 'J03', descripcion: 'Amigdalitis aguda' },
    { codigo: 'M54', descripcion: 'Dorsalgia' },
    { codigo: 'K21', descripcion: 'Enfermedad del reflujo gastroesofágico' },
    { codigo: 'R05', descripcion: 'Tos' },
    { codigo: 'Z00', descripcion: 'Examen médico general' }
  ];
  
  const diagnos = [];
  for (const d of dxList) {
    const dx = await prisma.diagnostico.create({
      data: {
        codigo: d.codigo,
        descripcion: encrypt(d.descripcion)
      }
    });
    diagnos.push(dx);
  }

  // 4. Crear 60 Pacientes
  console.log('Creating 60 patients...');
  const pacientes = [];
  for (let i = 0; i < 60; i++) {
    const pName = faker.person.firstName();
    const pLastName = faker.person.lastName();
    const cedula = `V-${faker.number.int({min: 5000000, max: 35000000})}`;
    const tlf = `04${faker.helpers.arrayElement(['14','24','12','26'])}-${faker.string.numeric(7)}`;
    const email = faker.internet.email({ firstName: pName, lastName: pLastName });
    
    // Assign random doctor
    const doc = faker.helpers.arrayElement(doctores);

    const pac = await prisma.paciente.create({
      data: {
        nombre: encrypt(pName),
        apellido: encrypt(pLastName),
        fechaNacimiento: faker.date.birthdate({ min: 5, max: 80, mode: 'age' }),
        genero: faker.helpers.arrayElement(['MASCULINO', 'FEMENINO']),
        documentoIdentidad: encrypt(cedula),
        documentoIdentidadHash: generateBlindIndex(cedula),
        telefono: encrypt(tlf),
        email: encrypt(email),
        clinicaId: clinica.id,
        medicoPrincipalId: doc.id
      }
    });
    pacientes.push(pac);
  }

  // 5. Crear Consultas Pasadas (aprox 3 a 5 por paciente)
  console.log('Creating past consultations...');
  for (const pac of pacientes) {
    const numConsultas = faker.number.int({ min: 1, max: 5 });
    for (let j = 0; j < numConsultas; j++) {
      const fechaC = faker.date.past({ years: 1 });
      const dx = faker.helpers.arrayElement(diagnos);
      
      const isCardio = dx.codigo === 'I10';
      const bps = [
        `${faker.number.int({min:110, max:130})}/${faker.number.int({min:70, max:85})}`,
        `${faker.number.int({min:140, max:160})}/${faker.number.int({min:90, max:100})}` // HTN
      ];
      
      const con = await prisma.consulta.create({
        data: {
          fecha: fechaC,
          motivo: encrypt(faker.lorem.sentence()),
          sintomas: encrypt(faker.lorem.sentences(2)),
          presionArterial: isCardio ? bps[1] : bps[0],
          temperatura: faker.number.float({min: 36.5, max: 38.5, fractionDigits: 1}),
          frecuenciaCardiaca: faker.number.int({min: 60, max: 100}),
          peso: faker.number.float({min: 50, max: 100, fractionDigits: 1}),
          observaciones: encrypt(faker.lorem.sentence()),
          pacienteId: pac.id,
          medicoId: pac.medicoPrincipalId, // Using the assigned principal doc
        }
      });

      // Link Dx
      await prisma.consultaDiagnostico.create({
        data: {
          consultaId: con.id,
          diagnosticoId: dx.id
        }
      });

      // 50% chance of Tratamiento
      if (faker.datatype.boolean()) {
        await prisma.tratamiento.create({
          data: {
            medicamento: encrypt(faker.helpers.arrayElement(['Losartán', 'Ibuprofeno', 'Loratadina', 'Amoxicilina', 'Omeprazol'])),
            dosis: encrypt(faker.helpers.arrayElement(['50mg', '400mg', '10mg', '500mg', '20mg'])),
            frecuencia: encrypt(faker.helpers.arrayElement(['Cada 8 horas', 'Cada 12 horas', 'Una vez al día'])),
            duracion: encrypt(faker.helpers.arrayElement(['5 días', '7 días', 'Continuo'])),
            indicaciones: encrypt('Tomar con las comidas'),
            consultaId: con.id
          }
        });
      }
    }
  }

  // 6. Crear Citas (algunas hoy, algunas futuro)
  console.log('Creating appointments...');
  const today = new Date();
  today.setHours(0,0,0,0);
  
  // Create 15 appointments for today (across the 4 docs)
  for (let i = 0; i < 15; i++) {
    const pac = faker.helpers.arrayElement(pacientes);
    const doc = doctores[i % doctores.length]; // Distribute
    const isReady = faker.datatype.boolean(); // 50% chance the triage is done
    
    let aptTime = new Date();
    aptTime.setHours(8 + faker.number.int({min: 0, max: 8}), faker.helpers.arrayElement([0, 15, 30, 45]), 0, 0);

    await prisma.cita.create({
      data: {
        pacienteId: pac.id,
        medicoId: doc.id,
        fechaHora: aptTime,
        duracion: 30,
        tipo: faker.helpers.arrayElement(['rutina', 'control', 'urgencia']),
        estado: isReady ? 'confirmada' : 'pendiente',
      }
    });

    if (isReady) {
      // If confirmed, they passed triage, so create a triage record
      await prisma.consulta.create({
        data: {
          fecha: new Date(),
          motivo: encrypt('Triaje pre-consulta'),
          presionArterial: `${faker.number.int({min:110, max:130})}/${faker.number.int({min:70, max:80})}`,
          temperatura: faker.number.float({min: 36.5, max: 37.5, fractionDigits: 1}),
          frecuenciaCardiaca: faker.number.int({min: 60, max: 90}),
          peso: faker.number.float({min: 50, max: 100, fractionDigits: 1}),
          pacienteId: pac.id,
          medicoId: doc.id
        }
      });
    }
  }

  // Future appointments
  for (let i = 0; i < 20; i++) {
    const pac = faker.helpers.arrayElement(pacientes);
    const doc = faker.helpers.arrayElement(doctores);
    const aptTime = faker.date.soon({ days: 14 });
    
    await prisma.cita.create({
      data: {
        pacienteId: pac.id,
        medicoId: doc.id,
        fechaHora: aptTime,
        duracion: 30,
        tipo: 'control',
        estado: 'pendiente'
      }
    });
  }

  // 7. Auditorias
  console.log('Creating audit logs...');
  for (let i = 0; i < 30; i++) {
    await prisma.auditoria.create({
      data: {
        accion: faker.helpers.arrayElement(['LOGIN_EXITOSO', 'VER_HISTORIA_CLINICA', 'CREAR_CITA', 'ACTUALIZAR_PACIENTE']),
        detalles: `Acción realizada por el usuario en el sistema`,
        ipAddress: faker.internet.ipv4(),
        fecha: faker.date.recent({ days: 3 }),
        usuarioId: faker.helpers.arrayElement([...doctores, ...enfermeros]).id
      }
    });
  }

  console.log('Seeding finished successfully!');
}

main().catch(console.error).finally(() => prisma.$disconnect());

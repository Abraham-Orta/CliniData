const { PrismaClient } = require('./src/generated/client');
const prisma = new PrismaClient();

async function test() {
  const waitlist = await prisma.listaEspera.findFirst({ include: { paciente: true } });
  if (!waitlist) {
    console.log('No waitlist found');
    return;
  }
  
  const medico = await prisma.usuario.findFirst({ where: { rol: 'MEDICO' } });
  
  console.log('Attempting to create appointment for paciente:', waitlist.pacienteId, 'medico:', medico.id);
  
  const payload = {
    pacienteId: waitlist.pacienteId,
    medicoId: medico.id,
    fechaHora: new Date().toISOString(),
    tipo: 'rutina',
    estado: 'confirmada',
    notas: null
  };
  
  // Use the exact schema
  const { createAppointmentSchema } = require('./src/utils/appointmentValidators');
  try {
    const parsed = createAppointmentSchema.parse(payload);
    console.log('Schema parsed successfully!');
    
    // Simulate what the controller does
    const cita = await prisma.cita.create({ 
      data: {
        pacienteId: parsed.pacienteId,
        medicoId: parsed.medicoId,
        fechaHora: new Date(parsed.fechaHora),
        duracion: parsed.duracion || null,
        tipo: parsed.tipo || null,
        estado: parsed.estado || 'pendiente',
        notas: parsed.notas || null,
      },
      include: { paciente: true }
    });
    
    const { decrypt } = require('./src/utils/securityHelper');
    cita.paciente.nombre = decrypt(cita.paciente.nombre);
    
    console.log('Cita created successfully:', cita.id, 'Paciente name:', cita.paciente.nombre);
  } catch (err) {
    console.error('Validation or Creation error:', err);
  }
  
  prisma.$disconnect();
}
test();

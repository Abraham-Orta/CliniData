const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');

async function test() {
  const prisma = new PrismaClient();
  const user = await prisma.usuario.findFirst({ where: { email: 'medico@clinidata.com' } });
  const paciente = await prisma.paciente.findFirst();

  if (!user || !paciente) {
    console.error('No se encontró médico o paciente para el test.');
    await prisma.$disconnect();
    return;
  }

  const token = jwt.sign(
    { userId: user.id, role: user.rol, clinicaId: user.clinicaId },
    'change_this_secret',
    { expiresIn: '1h' }
  );

  console.log('Médico ID:', user.id);
  console.log('Paciente ID:', paciente.id);

  const payload = {
    pacienteId: paciente.id,
    motivo: 'Consulta general de prueba',
    sintomas: 'Fiebre y dolor de cabeza',
    observaciones: 'Paciente estable',
    diagnosticos: [],
    tratamientos: [
      {
        medicamento: 'Paracetamol 500mg',
        dosis: '1 tableta',
        frecuencia: 'cada 8 horas',
        duracion: '3 días',
        indicaciones: 'Tomar con agua'
      }
    ]
  };

  try {
    const res = await fetch('http://localhost:3000/api/consultas', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    console.log('Status:', res.status);
    console.log('Respuesta:', JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Error en fetch:', err.message);
  }

  await prisma.$disconnect();
}

test();

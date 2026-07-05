const { PrismaClient } = require('./src/generated/client');
const prisma = new PrismaClient();

async function test() {
  const patient = await prisma.paciente.findFirst();
  if (!patient) {
    console.log('No patient found');
    return;
  }
  
  console.log('Attempting to update patient:', patient.id);
  
  const payload = {
    nombre: 'NuevoNombre',
    apellido: 'NuevoApellido'
  };
  
  const { patientSchema } = require('./src/utils/patientValidators');
  try {
    const parsed = patientSchema.partial().parse(payload);
    console.log('Schema parsed successfully!', parsed);
    
    // Simulate what the controller does
    const data = parsed;
    const { encrypt, decrypt } = require('./src/utils/securityHelper');
    
    if (data.nombre) data.nombre = encrypt(data.nombre);
    if (data.apellido) data.apellido = encrypt(data.apellido);
    
    const updated = await prisma.paciente.update({ where: { id: patient.id }, data });
    
    console.log('Patient updated successfully:', updated.id, 'Decrypted Name:', decrypt(updated.nombre));
  } catch (err) {
    console.error('Validation or Update error:', err);
  }
  
  prisma.$disconnect();
}
test();

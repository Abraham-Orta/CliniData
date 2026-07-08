const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');

async function test() {
  const prisma = new PrismaClient();
  const user = await prisma.usuario.findFirst();
  if (!user) return console.log('No users found');
  const token = jwt.sign(
    { userId: user.id, email: user.email, role: user.rol, clinicaId: user.clinicaId },
    process.env.JWT_SECRET || 'change_this_secret',
    { expiresIn: '1h' }
  );
  console.log('TOKEN:', token);
  
  const res = await fetch('http://localhost:3000/api/patients', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  console.log(res.status);
  console.log(await res.text());
}
test();

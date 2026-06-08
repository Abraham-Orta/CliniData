const { encrypt, decrypt, generateBlindIndex } = require('../src/utils/securityHelper');
const prisma = require('../src/config/database');

describe('Pruebas de Capa de Cifrado (FLE - Field-Level Encryption)', () => {
  test('Debería cifrar y descifrar texto correctamente usando AES-256-GCM', () => {
    const textoOriginal = 'Dato Clínico Confidencial';
    const textoCifrado = encrypt(textoOriginal);

    expect(textoCifrado).not.toBe(textoOriginal);
    expect(textoCifrado.split(':').length).toBe(3); // iv:tag:encrypted

    const textoDescifrado = decrypt(textoCifrado);
    expect(textoDescifrado).toBe(textoOriginal);
  });

  test('Debería generar Blind Index idéntico para el mismo texto e independiente de mayúsculas/espacios', () => {
    const dni1 = '12345678A';
    const dni2 = ' 12345678a ';

    const hash1 = generateBlindIndex(dni1);
    const hash2 = generateBlindIndex(dni2);

    expect(hash1).toBe(hash2);
    expect(hash1.length).toBe(64); // SHA-256 hex length
  });

  test('No debería descifrar un texto que no esté cifrado en el formato correcto', () => {
    const plano = 'texto_plano_sin_cifrar';
    const descifrado = decrypt(plano);
    expect(descifrado).toBe(plano);
  });
});

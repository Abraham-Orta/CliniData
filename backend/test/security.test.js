const { encrypt, decrypt, generateBlindIndex } = require('../src/utils/securityHelper');

describe('Security helper', () => {
  test('encrypt/decrypt roundtrip', () => {
    const text = 'Texto sensible de prueba 123';
    const cipher = encrypt(text);
    expect(cipher).toBeTruthy();
    const plain = decrypt(cipher);
    expect(plain).toBe(text);
  });

  test('generateBlindIndex deterministic and case-insensitive', () => {
    const a = generateBlindIndex('ABC123');
    const b = generateBlindIndex('abc123');
    expect(a).toBe(b);
    expect(a).toHaveLength(64);
  });
});

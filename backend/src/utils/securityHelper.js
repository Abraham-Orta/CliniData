/* eslint-disable node/no-unsupported-features/node-builtins */
const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 12 bytes para AES-GCM
const KEY_LENGTH = 32; // 256 bits

// Cache the derived key for the lifetime of the process.
// scryptSync is intentionally slow (it's a password-hashing KDF).
// Calling it on every encrypt/decrypt operation is the main performance bottleneck.
let _cachedKey = null;

function getEncryptionKey() {
  if (_cachedKey) return _cachedKey;

  const key = process.env.ENCRYPTION_KEY;
  if (!key) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('CRITICAL: ENCRYPTION_KEY must be defined in production!');
    }
    // Deterministic dev key
    _cachedKey = crypto.scryptSync('development_default_secure_key_123456', 'salt', KEY_LENGTH);
    return _cachedKey;
  }

  // If the key is already 64 hex chars (32 bytes), load it directly
  if (/^[0-9a-fA-F]{64}$/.test(key)) {
    _cachedKey = Buffer.from(key, 'hex');
    return _cachedKey;
  }

  // Otherwise derive a 32-byte key — only once
  _cachedKey = crypto.scryptSync(key, 'clinidata-salt', KEY_LENGTH);
  return _cachedKey;
}

/**
 * Cifra un texto utilizando AES-256-GCM.
 * Retorna un string en formato `iv:tag:cipherText` en formato hexadecimal.
 */
function encrypt(text) {
  if (text === null || text === undefined) return text;
  
  const textStr = typeof text === 'string' ? text : String(text);
  if (textStr.trim() === '') return textStr;

  try {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(textStr, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const tag = cipher.getAuthTag().toString('hex');

    return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted}`;
  } catch (error) {
    console.error('Encryption failed:', error);
    throw new Error('Error de cifrado de datos sensibles.');
  }
}

/**
 * Descifra un texto cifrado en formato `iv:tag:cipherText`.
 * Si el texto no cumple el formato, lo devuelve tal cual (por retrocompatibilidad o fallos de formato).
 */
function decrypt(cipherText) {
  if (!cipherText || typeof cipherText !== 'string') return cipherText;

  const parts = cipherText.split(':');
  if (parts.length !== 3) {
    return cipherText; // No está cifrado en el formato esperado
  }

  try {
    const [ivHex, tagHex, encryptedHex] = parts;
    const key = getEncryptionKey();
    const iv = Buffer.from(ivHex, 'hex');
    const tag = Buffer.from(tagHex, 'hex');
    
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);

    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    // Registramos el error de forma segura sin revelar los datos
    console.error('Decryption failed. Invalid key or corrupted data.');
    return cipherText; // Devolver texto cifrado para evitar pérdida de datos legibles si hay problemas
  }
}

/**
 * Genera un Blind Index (índice ciego) HMAC-SHA256 para búsquedas exactas.
 */
function generateBlindIndex(text) {
  if (text === null || text === undefined) return text;
  
  const cleanText = String(text).trim().toLowerCase();
  if (cleanText === '') return '';

  try {
    const key = getEncryptionKey();
    return crypto.createHmac('sha256', key)
      .update(cleanText)
      .digest('hex');
  } catch (error) {
    console.error('Blind Index generation failed:', error);
    throw new Error('Error de seguridad al indexar datos.');
  }
}

module.exports = {
  encrypt,
  decrypt,
  generateBlindIndex
};

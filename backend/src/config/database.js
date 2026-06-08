const { PrismaClient } = require('@prisma/client');
const { encrypt, decrypt, generateBlindIndex } = require('../utils/securityHelper');

const prisma = new PrismaClient();

// Campos que deben cifrarse y descifrarse por modelo
const encryptedFields = {
  paciente: ['nombre', 'apellido', 'documentoIdentidad', 'telefono', 'email', 'nombreTutor', 'dniTutor'],
  consulta: ['motivo', 'sintomas', 'observaciones'],
  diagnostico: ['descripcion'],
  tratamiento: ['medicamento', 'dosis', 'frecuencia', 'duracion', 'indicaciones'],
  notaclinica: ['contenido']
};

/**
 * Función recursiva para cifrar campos de datos en un objeto de entrada de Prisma.
 */
function encryptData(data, fields, modelNameLower) {
  if (!data || typeof data !== 'object') return;

  // Si es un Paciente y viene el documentoIdentidad plano, generamos el blind index
  if (modelNameLower === 'paciente' && data.documentoIdentidad !== undefined && data.documentoIdentidad !== null) {
    data.documentoIdentidadHash = generateBlindIndex(data.documentoIdentidad);
  }

  for (const field of fields) {
    if (data[field] !== undefined && data[field] !== null) {
      data[field] = encrypt(data[field]);
    }
  }
}

/**
 * Función recursiva para descifrar campos en un objeto de resultado de Prisma.
 */
function decryptItem(item, fields) {
  if (!item || typeof item !== 'object') return;
  for (const field of fields) {
    if (item[field] !== undefined && item[field] !== null) {
      item[field] = decrypt(item[field]);
    }
  }
}

/**
 * Descifra los resultados (puede ser un objeto o un array).
 */
function decryptResult(result, fields) {
  if (!result) return;
  if (Array.isArray(result)) {
    for (const item of result) {
      decryptItem(item, fields);
    }
  } else {
    decryptItem(result, fields);
  }
}

// Extensión para cifrado y descifrado transparente en Prisma
const securePrisma = prisma.$extends({
  query: {
    $allModels: {
      async $allOperations({ model, args, query }) {
        const modelLower = model.toLowerCase();
        const fields = encryptedFields[modelLower] || [];

        // 1. Interceptar escrituras (create, update, upsert, createMany, updateMany, etc.)
        if (fields.length > 0 && args.data) {
          encryptData(args.data, fields, modelLower);
        }

        // Si es una operación de lote en createMany
        if (fields.length > 0 && args.data && Array.isArray(args.data)) {
          for (const row of args.data) {
            encryptData(row, fields, modelLower);
          }
        }

        // 2. Interceptar búsquedas exactas por documentoIdentidad en where
        if (modelLower === 'paciente' && args.where) {
          // Búsqueda simple
          if (args.where.documentoIdentidad !== undefined) {
            args.where.documentoIdentidadHash = generateBlindIndex(args.where.documentoIdentidad);
            delete args.where.documentoIdentidad;
          }
          // Búsquedas complejas con AND/OR/NOT
          if (args.where.OR) {
            for (const cond of args.where.OR) {
              if (cond.documentoIdentidad !== undefined) {
                cond.documentoIdentidadHash = generateBlindIndex(cond.documentoIdentidad);
                delete cond.documentoIdentidad;
              }
            }
          }
          if (args.where.AND) {
            for (const cond of args.where.AND) {
              if (cond.documentoIdentidad !== undefined) {
                cond.documentoIdentidadHash = generateBlindIndex(cond.documentoIdentidad);
                delete cond.documentoIdentidad;
              }
            }
          }
        }

        // Ejecutar la consulta en la base de datos
        const result = await query(args);

        // 3. Interceptar lecturas para descifrar campos
        if (result && fields.length > 0) {
          decryptResult(result, fields);
        }

        return result;
      }
    }
  }
});

module.exports = securePrisma;

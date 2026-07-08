#!/bin/bash
# Script de Respaldo Encriptado para la Base de Datos SQLite (CliniData)
# Este script cumple con las normativas de protección de datos al asegurar
# que los respaldos no puedan ser leídos si son extraídos del servidor.

set -e

# Configuración
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKUP_DIR="${PROJECT_DIR}/backups"
DB_PATH="${PROJECT_DIR}/prisma/dev.db" # Ajustar si la ruta es diferente en producción
DATE=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILENAME="clinidata_backup_${DATE}.db"
ENCRYPTED_FILENAME="${BACKUP_FILENAME}.enc"
TMP_BACKUP_PATH="/tmp/${BACKUP_FILENAME}"
FINAL_BACKUP_PATH="${BACKUP_DIR}/${ENCRYPTED_FILENAME}"

# Asegurar que el directorio de respaldos exista
mkdir -p "$BACKUP_DIR"

# Contraseña de cifrado (se recomienda pasar por variable de entorno)
# Ej: export BACKUP_PASSWORD="super-secret-password"
if [ -z "$BACKUP_PASSWORD" ]; then
  echo "⚠️  ADVERTENCIA: BACKUP_PASSWORD no está definida. Usando contraseña por defecto."
  BACKUP_PASSWORD="clinidata-backup-key-2026"
fi

echo "Iniciando respaldo de base de datos..."

# 1. Realizar una copia segura de la base de datos (evita corrupción si hay escrituras concurrentes)
if command -v sqlite3 &> /dev/null; then
  echo "Utilizando sqlite3 para un volcado seguro..."
  sqlite3 "$DB_PATH" ".backup '${TMP_BACKUP_PATH}'"
else
  echo "sqlite3 no encontrado. Copiando el archivo directamente..."
  cp "$DB_PATH" "$TMP_BACKUP_PATH"
fi

# 2. Encriptar el respaldo (AES-256-CBC con PBKDF2)
echo "Encriptando respaldo..."
openssl enc -aes-256-cbc -salt -pbkdf2 -iter 100000 -in "$TMP_BACKUP_PATH" -out "$FINAL_BACKUP_PATH" -pass pass:"$BACKUP_PASSWORD"

# 3. Limpiar archivo temporal
rm "$TMP_BACKUP_PATH"

echo "✅ Respaldo completado exitosamente: ${FINAL_BACKUP_PATH}"
echo "🔒 Para desencriptar en caso de emergencia, use:"
echo "openssl enc -d -aes-256-cbc -pbkdf2 -iter 100000 -in ${FINAL_BACKUP_PATH} -out restore.db"

# Opcional: Eliminar respaldos más antiguos a 30 días
find "$BACKUP_DIR" -name "*.enc" -type f -mtime +30 -delete
echo "🧹 Respaldos antiguos limpiados (si los hubiera)."


set -euo pipefail

DEST=/var/backups/playpoint
DIA=$(date +%F)
mkdir -p "$DEST"
umask 077

# Base de datos)
mysqldump --single-transaction --routines playpoint | gzip > "$DEST/db-$DIA.sql.gz"

# Fotos de perfil
tar -czf "$DEST/fotos-$DIA.tar.gz" -C /var/lib/playpoint uploads

# Borra respaldos de más de 14 días
find "$DEST" -type f -mtime +14 -delete
echo "Respaldo listo en $DEST ($DIA)"

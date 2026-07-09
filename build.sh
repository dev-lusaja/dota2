#!/bin/bash
# Script para empaquetar el sitio y aplicar cache-busting automático

echo "Creando carpeta dist..."
mkdir -p dist

echo "Copiando archivos..."
cp -r css data js public index.html reader.html _redirects dist/ 2>/dev/null || true

# Netlify provee $COMMIT_REF (el hash del commit actual)
# Si no existe (ej. corriendo en local), usamos el timestamp
VERSION=${COMMIT_REF:-$(date +%s)}

echo "Aplicando cache-busting con versión: $VERSION"

# Solo apuntamos a tus archivos locales, ignorando librerías externas
for file in "css/main.css" "css/reader.css" "js/comics-loader.js" "js/progress.js" "js/gallery.js" "js/tarot.js" "js/reader.js"; do
  sed -i '' "s|${file}\"|${file}?v=$VERSION\"|g" dist/*.html 2>/dev/null || sed -i "s|${file}\"|${file}?v=$VERSION\"|g" dist/*.html
done

echo "¡Build completado con éxito!"

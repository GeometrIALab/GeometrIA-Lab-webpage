#!/bin/bash
# Gera tools/wordpress/dist/geometria-lab.zip, o plugin pronto para enviar ao WordPress do CBG
# (Plugins → Adicionar novo → Enviar plugin). Rode da raiz do repositório ou de qualquer lugar:
#   tools/wordpress/build-plugin.sh
# O site é gerado com _config.yml + _config_cbg.yml (endereço /GeometrIALab e modo WordPress).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
DIST="$ROOT/tools/wordpress/dist"
PLUGIN="$DIST/geometria-lab"
JEKYLL="${JEKYLL:-bundle exec jekyll}"

rm -rf "$PLUGIN" "$DIST/geometria-lab.zip"
mkdir -p "$DIST"
cp -R "$ROOT/tools/wordpress/geometria-lab" "$PLUGIN"
# O plugin já vem com uma cópia do site (usada até a primeira publicação automática).
JEKYLL="$JEKYLL" "$ROOT/tools/wordpress/build-site.sh" "$PLUGIN/site"

# As páginas passam pelo plugin (que exige login no formulário); na pasta do plugin, o servidor
# só entrega CSS, fontes e imagens.
cat > "$PLUGIN/site/.htaccess" << 'HT'
<FilesMatch "\.(html|xml|txt)$">
  <IfModule mod_authz_core.c>
    Require all denied
  </IfModule>
  <IfModule !mod_authz_core.c>
    Order allow,deny
    Deny from all
  </IfModule>
</FilesMatch>
HT
(cd "$DIST" && zip -qrX geometria-lab.zip geometria-lab)
echo "Pronto: $DIST/geometria-lab.zip ($(du -h "$DIST/geometria-lab.zip" | cut -f1))"
